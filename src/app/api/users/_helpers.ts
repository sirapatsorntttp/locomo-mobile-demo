const ROLE_MAP: Record<string, string> = {
  SuperAdmin: 'super_admin', Admin: 'admin',
  Employee: 'employee', Driver: 'driver',
}

export function toUserAccount(u: any) {
  const detail     = u.userDetail ?? {}
  const firstRole  = u.roles?.[0] ?? {}
  const roleType   = firstRole.type ?? ''
  const role       = ROLE_MAP[roleType] ?? 'employee'
  const accountType = roleType === 'Driver' ? 'driver'
    : (roleType === 'SuperAdmin' || roleType === 'Admin') ? 'standalone'
    : 'employee'

  return {
    id:           u.id,
    username:     u.username ?? detail.code ?? '',
    role,
    roles:        u.roles ?? [],
    account_type: accountType,
    employee_id:  accountType === 'employee' ? (detail.employeeId ?? null) : null,
    driver_id:    accountType === 'driver'   ? (detail.driverId   ?? null) : null,
    company_id:   null,
    email:        detail.email ?? null,
    tel:          detail.tel   ?? null,
    is_status:    u.status     ?? 'active',
    created_by:   u.createdBy  ?? null,
    created_at:   u.createdAt  ? String(u.createdAt) : '',
    updated_by:   u.updatedBy  ?? null,
    updated_at:   u.updatedAt  ? String(u.updatedAt) : null,
    employee: accountType !== 'driver' ? {
      id:            '',
      rfid:          detail.rfid          ?? '',
      code:          detail.code          ?? '',
      first_name_th: detail.firstNameTh   ?? '',
      last_name_th:  detail.lastNameTh    ?? '',
      first_name_en: detail.firstNameEn   ?? '',
      last_name_en:  detail.lastNameEn    ?? '',
      email:         detail.email         ?? null,
      address:       detail.address       ?? null,
      image:         detail.image         ?? '',
      username:      u.username           ?? '',
      language:      'th',
      is_status:     'active',
      created_by: null, created_at: '', updated_by: null, updated_at: null,
    } : undefined,
    driver: accountType === 'driver' ? {
      id:            '',
      code:          detail.code          ?? '',
      first_name_th: detail.firstNameTh   ?? '',
      last_name_th:  detail.lastNameTh    ?? '',
      first_name_en: detail.firstNameEn   ?? '',
      last_name_en:  detail.lastNameEn    ?? '',
      tel:           detail.tel           ?? null,
      username:      u.username           ?? '',
      language:      'th',
      is_status:     'active',
      created_by: null, created_at: '', updated_by: null, updated_at: null,
    } : undefined,
  }
}
