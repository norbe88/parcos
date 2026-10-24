import React, { Suspense } from 'react';
import { VehicleItem, VehicleExpenseItem } from '../../db/seed';
import { DealerProfile } from '../../db/types';

// Lazy load pentru modalele mari
const VehicleDetailModal = React.lazy(() => 
  import('./VehicleDetailModal').then(m => ({ default: m.VehicleDetailModal }))
);
const PrintableVehicleSheet = React.lazy(() => 
  import('../print/PrintableVehicleSheet').then(m => ({ default: m.PrintableVehicleSheet }))
);

export interface AppModalContainerProps {
  safeSelectedCar: VehicleItem | null;
  selectedCar: VehicleItem | null;
  modalTab?: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines';
  videoFormat?: 'tiktok' | 'youtube';
  viewMode: string;
  tenant: DealerProfile;
  showToast: (msg: string) => void;
  onCloseDetailModal: () => void;
  onPrintVehicleSheet: () => void;
  onAddExpense: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  onDeleteExpense: (carId: string, expenseId: string) => void;
  onUpdatePurchasePrice: (carId: string, price: number) => void;
  onUpdateSaleInfo: (carId: string, soldPriceEur: number, soldAt?: string) => void;
  onUpdateVehicleDeadlines: (carId: string, deadlines: any) => void;
  onToggleVatDeductible: (carId: string) => void;
  onUpdateDescription: (carId: string, description: string) => void;
  onEditCar: (car: VehicleItem) => void;
}

export const AppModalContainer: React.FC<AppModalContainerProps> = ({
  safeSelectedCar,
  selectedCar,
  modalTab,
  videoFormat,
  viewMode,
  tenant,
  showToast,
  onCloseDetailModal,
  onPrintVehicleSheet,
  onAddExpense,
  onDeleteExpense,
  onUpdatePurchasePrice,
  onUpdateSaleInfo,
  onUpdateVehicleDeadlines,
  onToggleVatDeductible,
  onUpdateDescription,
  onEditCar,
}) => {
  return (
    <>
      <Suspense fallback={null}>
        {safeSelectedCar && (
          <VehicleDetailModal 
            selectedCar={safeSelectedCar}
            initialTab={modalTab}
            initialVideoFormat={videoFormat}
            onClose={onCloseDetailModal}
            onPrint={onPrintVehicleSheet}
            showToast={showToast}
            dealer={tenant}
            viewMode={viewMode === 'admin' ? 'admin' : 'showroom'}
            onAddExpense={onAddExpense}
            onDeleteExpense={onDeleteExpense}
            onUpdatePurchasePrice={onUpdatePurchasePrice}
            onUpdateSaleInfo={onUpdateSaleInfo}
            onUpdateVehicleDeadlines={onUpdateVehicleDeadlines}
            onToggleVatDeductible={onToggleVatDeductible}
            onUpdateDescription={onUpdateDescription}
            onEditCar={onEditCar}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <PrintableVehicleSheet 
          selectedCar={selectedCar}
          dealer={tenant}
        />
      </Suspense>
    </>
  );
};

export default AppModalContainer;
