export function toEmployee(e: any) {
  const transportDefaults = Array.isArray(e.transportDefaults)
    ? e.transportDefaults.map((td: any) => ({
        id: td.id,
        trip_direction: td.trip_direction,
        route_id: td.route_id ?? null,
        point_id: td.point_id ?? null,
        route: td.route ?? null,
        point: td.point ?? null,
      }))
    : []
  const defaults = e.defaults
    ? {
        organizationUnit: e.defaults.organizationUnit
          ? {
              id:          e.defaults.organizationUnit.id,
              code:        e.defaults.organizationUnit.code,
              nameTh:      e.defaults.organizationUnit.nameTh,
              nameEn:      e.defaults.organizationUnit.nameEn,
              levelNameTh: e.defaults.organizationUnit.levelNameTh,
              levelNameEn: e.defaults.organizationUnit.levelNameEn,
            }
          : null,
        level: e.defaults.level
          ? {
              id:     e.defaults.level.id,
              code:   e.defaults.level.code,
              nameTh: e.defaults.level.nameTh,
              nameEn: e.defaults.level.nameEn,
            }
          : null,
      }
    : undefined

  return {
    id:                 e.id,
    rfid:               e.rfid         ?? '',
    code:               e.code         ?? '',
    first_name_th:      e.firstNameTh  ?? '',
    last_name_th:       e.lastNameTh   ?? '',
    first_name_en:      e.firstNameEn  ?? '',
    last_name_en:       e.lastNameEn   ?? '',
    email:              e.email        ?? null,
    address:            e.address      ?? null,
    image:              e.image        ?? '',
    username:           e.username     ?? '',
    language:           e.language     ?? 'th',
    is_status:          e.status       ?? 'active',
    created_by:         e.createdBy    ?? null,
    created_at:         e.createdAt    ? String(e.createdAt) : '',
    updated_by:         e.updatedBy    ?? null,
    updated_at:         e.updatedAt    ? String(e.updatedAt) : null,
    defaults,
    transport_defaults: transportDefaults,
  }
}

export function fromEmployee(data: any) {
  const m: Record<string, any> = {}
  if (data.rfid             != null) m.rfid             = data.rfid
  if (data.code             != null) m.code             = data.code
  if (data.first_name_th    != null) m.firstNameTh      = data.first_name_th
  if (data.last_name_th     != null) m.lastNameTh       = data.last_name_th
  if (data.first_name_en    != null) m.firstNameEn      = data.first_name_en
  if (data.last_name_en     != null) m.lastNameEn       = data.last_name_en
  if (data.email            != null) m.email            = data.email
  if (data.address          != null) m.address          = data.address
  if (data.image            != null) m.image            = data.image
  if (data.is_status            != null) m.status               = data.is_status
  if (data.company_plant_id    != null) m.company_plant_id     = data.company_plant_id
  if (data.organization_unit_id != null) m.organization_unit_id = data.organization_unit_id
  if (data.level_id             != null) m.level_id             = data.level_id
  if (Array.isArray(data.transportDefaults)) m.transportDefaults = data.transportDefaults
  return m
}
