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
      phone:              e.phone        ?? null,
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
    
    
  // company_id:        e.companyId        ?? null,
  //   plant_ids:         e.plantIds         ?? [],
  //   company_plant_ids: e.companyPlantIds  ?? [],



  }
}

export function fromEmployee(data: any) {
  const result: Record<string, any> = {}

  const firstNameTh =
    data.first_name_th ?? data.firstNameTh
  const lastNameTh =
    data.last_name_th ?? data.lastNameTh
  const firstNameEn =
    data.first_name_en ?? data.firstNameEn
  const lastNameEn =
    data.last_name_en ?? data.lastNameEn
  const status =
    data.is_status ?? data.status

  if (data.rfid != null) {
    result.rfid = data.rfid
  }

  if (data.code != null) {
    result.code = data.code
  }

  if (firstNameTh != null) {
    result.firstNameTh = firstNameTh
  }

  if (lastNameTh != null) {
    result.lastNameTh = lastNameTh
  }

  if (firstNameEn != null) {
    result.firstNameEn = firstNameEn
  }

  if (lastNameEn != null) {
    result.lastNameEn = lastNameEn
  }

  if (data.email != null) {
    result.email = data.email
  }

  if (data.phone != null) {
    result.phone = data.phone
  }

  if (data.address != null) {
    result.address = data.address
  }

  if (data.image != null) {
    result.image = data.image
  }

  if (status != null) {
    result.status = status
  }

  if (data.company_plant_id != null) {
    result.company_plant_id = data.company_plant_id
  }

  if (data.organization_unit_id != null) {
    result.organization_unit_id =
      data.organization_unit_id
  }

  if (data.level_id != null) {
    result.level_id = data.level_id
  }

  if (Array.isArray(data.transportDefaults)) {
    result.transportDefaults =
      data.transportDefaults.map((td: any) => ({
        trip_direction: td.trip_direction,
        route_id: td.route_id || undefined,
        point_id: td.point_id || undefined,
      }))
  }

  return result
}