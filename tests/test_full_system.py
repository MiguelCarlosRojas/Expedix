import pytest
from django.core.management import call_command
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.roles.models import Role
from apps.templates_manager.models import DocumentTemplate

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def seeded_db(db):
    call_command('seed_system_data')

@pytest.fixture
def admin_user(seeded_db):
    return User.objects.get(username='admin')

@pytest.fixture
def auth_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client

@pytest.mark.django_db
def test_login_and_logout(api_client, admin_user):
    # Test login
    res = api_client.post('/api/v1/auth/login/', {'username': 'admin', 'password': 'admin123'})
    assert res.status_code == 200
    assert 'user' in res.data
    assert res.data['user']['username'] == 'admin'

    # Test logout
    res_logout = api_client.post('/api/v1/auth/logout/')
    assert res_logout.status_code == 200

@pytest.mark.django_db
def test_profile_update(auth_client, admin_user):
    res = auth_client.put('/api/v1/auth/profile/', {
        'first_name': 'Carlos',
        'last_name': 'Mendoza',
        'phone': '+51 999 888 777',
        'job_title': 'Arquitecto de Soluciones'
    })
    assert res.status_code == 200
    assert res.data['user']['first_name'] == 'Carlos'
    admin_user.refresh_from_db()
    assert admin_user.first_name == 'Carlos'
    assert admin_user.phone == '+51 999 888 777'

@pytest.mark.django_db
def test_shortcuts_inicio(auth_client):
    res = auth_client.get('/api/v1/home/shortcuts/')
    assert res.status_code == 200
    shortcuts = res.data['shortcuts']
    assert len(shortcuts) >= 8
    titles = [s['title'] for s in shortcuts]
    assert 'Crear expediente' in titles
    assert 'Administrar Drives' in titles

@pytest.mark.django_db
def test_dashboard_stats_and_charts(auth_client):
    res_stats = auth_client.get('/api/v1/dashboard/stats/')
    assert res_stats.status_code == 200
    assert 'total_expedientes' in res_stats.data
    assert 'generados' in res_stats.data
    assert 'plantillas_activas' in res_stats.data

    res_charts = auth_client.get('/api/v1/dashboard/charts/')
    assert res_charts.status_code == 200
    assert 'docs_by_month' in res_charts.data
    assert 'expedientes_by_status' in res_charts.data
    assert 'docs_by_template_type' in res_charts.data
    assert 'user_productivity' in res_charts.data
    assert 'generation_evolution' in res_charts.data
    assert 'storage_by_drive' in res_charts.data
    assert 'process_success_rate' in res_charts.data

@pytest.mark.django_db
def test_templates_and_duplicate(auth_client):
    res = auth_client.get('/api/v1/templates/')
    assert res.status_code == 200
    items = res.data.get('results', res.data)
    assert len(items) >= 1
    t_id = items[0]['id']

    # Duplicate template
    res_dup = auth_client.post(f'/api/v1/templates/{t_id}/duplicate/')
    assert res_dup.status_code == 201
    assert '(Copia)' in res_dup.data['nombre']

@pytest.mark.django_db
def test_drives_explorer_and_folder_creation(auth_client):
    res = auth_client.get('/api/v1/drives/explorer/')
    assert res.status_code == 200
    assert 'folders' in res.data
    assert 'files' in res.data
    assert 'breadcrumbs' in res.data

    # Create new folder
    res_f = auth_client.post('/api/v1/drives/create-folder/', {'name': 'Carpeta de Prueba'})
    assert res_f.status_code == 201
    assert res_f.data['name'] == 'Carpeta de Prueba'

@pytest.mark.django_db
def test_spreadsheet_univer_data_and_save(auth_client):
    # Create Sheet file
    res_sheet = auth_client.post('/api/v1/drives/create-document/', {'name': 'Hoja_Test', 'type': 'sheet'})
    assert res_sheet.status_code == 201
    file_id = res_sheet.data['id']

    # Get Univer SDK data
    res_data = auth_client.get(f'/api/v1/spreadsheets/{file_id}/data/')
    assert res_data.status_code == 200
    assert 'univer_data' in res_data.data

    # Save debounced / manual snapshot using JSON format
    snapshot = res_data.data['univer_data']
    res_save = auth_client.post(f'/api/v1/spreadsheets/{file_id}/save/', {
        'snapshot': snapshot,
        'is_autosave': True
    }, format='json')
    assert res_save.status_code == 200
    assert res_save.data['is_autosave'] is True

@pytest.mark.django_db
def test_expediente_lifecycle_and_pdf(auth_client):
    template = DocumentTemplate.objects.get(nombre="Acta de Conformidad de Servicio")
    assert template is not None

    # 1. Create Expediente
    res_exp = auth_client.post('/api/v1/documents/', {
        'asunto': 'Servicio de Consultoría Cloud',
        'solicitante': 'Empresa Andina S.A.',
        'template': template.id,
        'dynamic_values': {
            'razon_social_proveedor': 'Consultores Andinos S.A.',
            'ruc_proveedor': '20123456789',
            'numero_orden': 'OS-2026-0045',
            'fecha_emision': '2026-02-15',
            'monto_total': 'S/ 15,000.00',
            'descripcion_servicio': 'Auditoría Cloud completa.',
            'responsable_area': 'Ing. Carlos Mendoza',
            'representante_proveedor': 'Dra. María Elena Ramos'
        }
    }, format='json')
    assert res_exp.status_code == 201
    exp_id = res_exp.data['id']

    # 2. Generate Document
    res_gen = auth_client.post(f'/api/v1/documents/{exp_id}/generate_document/', {}, format='json')
    assert res_gen.status_code == 200
    assert res_gen.data['expediente']['estado'] == 'GENERADO'

    # 3. Download PDF
    res_pdf = auth_client.get(f'/api/v1/documents/{exp_id}/download_pdf/')
    assert res_pdf.status_code == 200
    assert res_pdf['content-type'] == 'application/pdf'
    assert len(res_pdf.content) > 1000

@pytest.mark.django_db
def test_the_five_reports(auth_client):
    for r_id in ['1', '2', '3', '4', '5']:
        res = auth_client.get(f'/api/v1/reports/{r_id}/')
        assert res.status_code == 200
        assert 'title' in res.data
        assert 'table_data' in res.data
        assert 'headers' in res.data

        # Export test Excel
        res_export = auth_client.get(f'/api/v1/reports/{r_id}/export/?format=excel')
        assert res_export.status_code == 200
        assert 'openxmlformats' in res_export['content-type']
