export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  job_title: string;
  avatar_url?: string;
  avatar_display: string;
  role: number | null;
  role_details?: Role;
  permissions_list: string[];
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  is_system: boolean;
  permissions?: Permission[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  codename: string;
  name: string;
  description: string;
}

export interface Company {
  id: number;
  razon_social: string;
  nombre_comercial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  correo: string;
  pagina_web: string;
  logo?: string;
  logo_url?: string;
  descripcion: string;
  encabezado_documental: string;
  pie_pagina_documental: string;
  prefijo_expedientes: string;
  correlativo_actual: number;
  zona_horaria: string;
  updated_at?: string;
}

export interface ShortcutCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  color: string;
  module: string;
  action: string;
}

export interface DashboardStats {
  total_expedientes: number;
  generados: number;
  pendientes: number;
  en_proceso: number;
  errores: number;
  plantillas_activas: number;
  drives_conectados: number;
  usuarios_activos: number;
}

export interface DashboardCharts {
  docs_by_month: Array<{ month: string; generados: number; pendientes: number; errores: number }>;
  expedientes_by_status: Array<{ name: string; value: number; color: string }>;
  docs_by_template_type: Array<{ tipo: string; total: number }>;
  user_productivity: Array<{ usuario: string; procesados: number; generados: number }>;
  generation_evolution: Array<{ date: string; total: number }>;
  storage_by_drive: Array<{ drive: string; size_mb: number; files_count: number }>;
  process_success_rate: Array<{ name: string; value: number; color: string; status?: string; count?: number }>;
}

export interface IntegrationsStatus {
  google_drive: {
    status: string;
    connected: boolean;
    latency_ms: number;
    active_folders: number;
    total_files: number;
  };
  google_sheets: {
    status: string;
    connected: boolean;
    latency_ms: number;
    sync_engine: string;
  };
  celery_workers: {
    status: string;
    workers_online: number;
    beat_scheduler: string;
    queue_backlog: number;
  };
  database: {
    engine: string;
    status: string;
  };
}

export interface DynamicField {
  id?: number;
  template?: number;
  name: string;
  identifier: string;
  field_type: string;
  description?: string;
  placeholder?: string;
  default_value?: string;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  options?: Array<{ label: string; value: string }>;
  order: number;
  section: string;
  width: string;
  visibility_conditions?: Record<string, any>;
  sheets_column?: string;
  docs_tag?: string;
}

export interface DocumentTemplate {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  google_doc_id: string;
  drive_id: string;
  target_folder_id: string;
  target_folder_name: string;
  naming_pattern: string;
  is_active: boolean;
  version: number;
  content_preview?: string;
  fields: DynamicField[];
  fields_count: number;
  versions_count: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Expediente {
  id: number;
  numero_expediente: string;
  asunto: string;
  solicitante: string;
  template: number;
  template_details?: DocumentTemplate;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'GENERADO' | 'ERROR' | 'OBSERVADO';
  estado_display: string;
  dynamic_values: Record<string, any>;
  drive_id: string;
  drive_folder_id: string;
  drive_folder_name: string;
  google_doc_id: string;
  google_doc_url: string;
  pdf_drive_file_id: string;
  pdf_url: string;
  error_message?: string;
  retry_count: number;
  processing_time_seconds?: number;
  responsable?: number;
  responsable_name?: string;
  fecha_generacion?: string;
  created_at: string;
  updated_at: string;
}

export interface DriveBreadcrumb {
  id: number | null;
  google_folder_id?: string;
  name: string;
}

export interface DriveFolderItem {
  id: number;
  name: string;
  google_folder_id: string;
  items_count: number;
  updated_at: string;
  is_folder: boolean;
}

export interface DriveFileItem {
  id: number;
  name: string;
  google_file_id: string;
  mime_type: string;
  size: string;
  size_bytes: number;
  owner_name: string;
  updated_at: string;
  web_view_link?: string;
  is_folder: boolean;
}

export interface DriveExplorerData {
  current_folder: {
    id: number | null;
    name: string;
    google_folder_id?: string;
  };
  breadcrumbs: DriveBreadcrumb[];
  folders: DriveFolderItem[];
  files: DriveFileItem[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'GENERADO' | 'ERROR' | 'PENDIENTE' | 'OBSERVADO' | 'REINTENTO' | 'CONEXION' | 'ADMIN';
  type_display?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ReportData {
  title: string;
  kpis?: Record<string, any>;
  headers: string[];
  table_data: Array<Record<string, any>>;
}
