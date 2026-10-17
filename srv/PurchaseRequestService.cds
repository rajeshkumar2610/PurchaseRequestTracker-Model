using { rajesh.db.master, rajesh.db.transaction } from '../db/datamodel';

service PurchaseRequestService @(path:'purchase-requests') {
    @odata.draft.enabled
    entity PurchaseRequestsSet as projection on transaction.PurchaseRequests
    actions{
        @Common.SideEffects:{
            $Type : 'Common.SideEffectsType',
            TargetProperties:['in/status','in/approverEmail','in/approvalDate','in/approverRemarks']
        }
        action approveRequest(
            approverEmail:String(100) not null, 
            approverRemarks:String(500)
            );

        @Common.SideEffects:{
            $Type : 'Common.SideEffectsType',
            TargetProperties:['in/status','in/approverEmail','in/approvalDate','in/approverRemarks']
        }
        action rejectRequest(
            approverEmail:String(100) not null,
            approverRemarks:String(500) not null
        )
    };


    entity DepartmentsSet  as projection on master.Departments;

    entity ItemCategoriesSet  as projection on master.ItemCategories;

    @readonly
    entity PurchaseRequestReport as projection on transaction.PurchaseRequestReport;
}
