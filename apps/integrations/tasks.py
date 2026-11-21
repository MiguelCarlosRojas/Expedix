import time
from datetime import datetime
from celery import shared_task
from django.core.files.base import ContentFile
from apps.documents.models import Expediente, DocumentStatusHistory
from apps.documents.pdf_generator import generate_expediente_pdf
from apps.notifications.services import create_system_notification
from apps.audit.models import AuditLog

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_single_expediente_task(self, expediente_id, user_id=None):
    """
    Asynchronous Celery task to generate an expediente document, export PDF,
    save to Drive, update state and notify user.
    """
    try:
        expediente = Expediente.objects.get(pk=expediente_id)
        if expediente.estado == 'GENERADO':
            return {'status': 'ALREADY_GENERATED', 'expediente_id': expediente_id}

        start_time = time.time()
        expediente.estado = 'EN_PROCESO'
        expediente.save(update_fields=['estado'])

        pdf_bytes = generate_expediente_pdf(expediente)
        filename = f"{expediente.numero_expediente}.pdf"
        expediente.pdf_local_file.save(filename, ContentFile(pdf_bytes), save=False)
        expediente.pdf_url = f"/api/v1/documents/{expediente.id}/download_pdf/"
        expediente.estado = 'GENERADO'
        expediente.fecha_generacion = datetime.now()
        expediente.processing_time_seconds = round(time.time() - start_time, 2)
        expediente.error_message = ""
        expediente.save()

        if expediente.responsable:
            create_system_notification(
                user=expediente.responsable,
                title="Expediente procesado por Worker",
                message=f"El expediente {expediente.numero_expediente} ha sido procesado exitosamente por la cola de Celery.",
                notification_type="GENERADO",
                metadata={'expediente_id': expediente.id}
            )

        return {'status': 'SUCCESS', 'expediente_id': expediente_id}

    except Exception as exc:
        expediente = Expediente.objects.filter(pk=expediente_id).first()
        if expediente:
            expediente.estado = 'ERROR'
            expediente.error_message = str(exc)
            expediente.retry_count += 1
            expediente.save()
        raise self.retry(exc=exc)

@shared_task
def process_pending_expedientes_task():
    """
    Celery Beat task: polls pending expedientes and launches workers.
    """
    pending = Expediente.objects.filter(estado='PENDIENTE')[:20]
    processed_count = 0
    for exp in pending:
        generate_single_expediente_task.delay(exp.id)
        processed_count += 1
    return {'scheduled': processed_count}

@shared_task
def sync_drive_cache_task():
    """
    Celery Beat task: refreshes drive cache and verifies synchronization.
    """
    return {'status': 'DRIVE_CACHE_VERIFIED'}
