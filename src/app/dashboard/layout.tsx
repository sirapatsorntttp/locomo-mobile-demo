import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/layout/AuthGuard'
import ToastContainer from '@/components/ui/Toast'
import { AddEmployeeModal, EditEmployeeModal, ViewEmployeeModal, DeleteEmployeeModal } from '@/components/modals/EmployeeModals'
import { AddReserveModal, ViewReserveModal, DeleteReserveModal } from '@/components/modals/ReserveModals'
import { AddVehicleTypeModal, EditVehicleTypeModal, DeleteVehicleTypeModal, AddVehicleModal, EditVehicleModal, DeleteVehicleModal, AddShiftModal, EditShiftModal, DeleteShiftModal, AddShiftGroupModal, EditShiftGroupModal, AddCalendarModal, AssignDriverVehicleModal, AddCoordinatorModal, EditCoordinatorModal, DeleteCoordinatorModal, AddCoordinatorTypeModal, EditCoordinatorTypeModal, DeleteCoordinatorTypeModal } from '@/components/modals/OtherModals'
import { AddDriverModal, EditDriverModal, DeleteDriverModal } from '@/components/modals/DriverModals'
import { AddRouteModal, EditRouteModal, DeleteRouteModal, AddPointModal, EditPointModal, DeletePointModal } from '@/components/modals/RouteModals'
import { AddPostModal, EditPostModal, DeletePostModal } from '@/components/modals/PostModals'
import { AddVendorModal, DeleteVendorModal } from '@/components/modals/VendorModals'
import { AddUserAccountModal, EditUserAccountModal, ViewUserAccountModal, DeleteUserAccountModal } from '@/components/modals/UserAccountModals'
import { AddBookingPolicyModal, EditBookingPolicyModal, ViewBookingPolicyModal, DeleteBookingPolicyModal } from '@/components/modals/BookingPolicyModals'
import { BulkReserveModal } from '@/components/modals/BulkReserveModal'
import { BulkEditReserveModal } from '@/components/modals/BulkEditReserveModal'
import { BulkAddUserAccountModal } from '@/components/modals/BulkAddUserAccountModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <AddEmployeeModal /><EditEmployeeModal /><ViewEmployeeModal /><DeleteEmployeeModal />
      <AddReserveModal /><ViewReserveModal /><DeleteReserveModal />
      <AddVehicleTypeModal /><EditVehicleTypeModal /><DeleteVehicleTypeModal />
      <AddVehicleModal /><EditVehicleModal /><DeleteVehicleModal />
      <AddDriverModal /><EditDriverModal /><DeleteDriverModal /><AssignDriverVehicleModal />
      <AddShiftModal /><EditShiftModal /><DeleteShiftModal />
      <AddShiftGroupModal /><EditShiftGroupModal />
      <AddCalendarModal />
      <AddRouteModal /><EditRouteModal /><DeleteRouteModal />
      <AddPointModal /><EditPointModal /><DeletePointModal />
      <AddPostModal /><EditPostModal /><DeletePostModal />
      <AddVendorModal /><DeleteVendorModal />
      <AddCoordinatorModal /><EditCoordinatorModal /><DeleteCoordinatorModal />
      <AddCoordinatorTypeModal /><EditCoordinatorTypeModal /><DeleteCoordinatorTypeModal />
      <AddUserAccountModal /><EditUserAccountModal /><ViewUserAccountModal /><DeleteUserAccountModal />
      <AddBookingPolicyModal /><EditBookingPolicyModal /><ViewBookingPolicyModal /><DeleteBookingPolicyModal />
      <BulkReserveModal />
      <BulkEditReserveModal />
      <BulkAddUserAccountModal />
      <ToastContainer />
      <AuthGuard />
    </div>
  )
}
