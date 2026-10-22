using {
    rajesh.db.master,
    rajesh.db.transaction,
    rajesh.db.UploadResult
} from '../db/datamodel';

service PurchaseRequestService @(path    : 'purchase-requests', requires: 'authenticated-user') {
    @cds.redirection.target
    @odata.draft.enabled
    entity PurchaseRequestsSet @(restrict: [
        { grant: 'READ', to: 'PurchaseRequestViewer' },
        { grant: 'CREATE', to: 'PurchaseRequestCreator' },
        { grant: ['approveRequest', 'rejectRequest'], to: 'PurchaseRequestApprover' },
        { grant: '*', to: 'PurchaseRequestAdmin' }
    ])                           as projection on transaction.PurchaseRequests
        actions {
            @Common.SideEffects: {
                $Type           : 'Common.SideEffectsType',
                TargetProperties: [
                    'in/status',
                    'in/approverEmail',
                    'in/approvalDate',
                    'in/approverRemarks'
                ]
            }    
            action approveRequest(approverEmail: String(100) not null,
                                  approverRemarks: String(500));

            @Common.SideEffects: {
                $Type           : 'Common.SideEffectsType',
                TargetProperties: [
                    'in/status',
                    'in/approverEmail',
                    'in/approvalDate',
                    'in/approverRemarks'
                ]
            }  
            action rejectRequest(approverEmail: String(100) not null,
                                 approverRemarks: String(500) not null);


        };

    action uploadPurchaseRequests(
        fileName    : String(255),
        fileContent : LargeString) returns UploadResult;

     @restrict: [
    { grant: 'READ', to: 'PurchaseRequestViewer' },
    { grant: '*', to: 'PurchaseRequestAdmin' }
    ]
    entity DepartmentsSet        as projection on master.Departments;


    @restrict: [
        { grant: 'READ', to: 'PurchaseRequestViewer' },
        { grant: '*', to: 'PurchaseRequestAdmin' }
    ]
    entity ItemCategoriesSet     as projection on master.ItemCategories;

    @readonly
     @restrict: [
    { grant: 'READ', to: 'PurchaseRequestViewer' },
    { grant: '*', to: 'PurchaseRequestAdmin' }
    ]
    entity PurchaseRequestReport as projection on transaction.PurchaseRequestReport;

    entity PurchaseRequestAttachmentsSet as projection on transaction.PurchaseRequestAttachments;

    entity PurchaseRequestUploadLogsSet as projection on transaction.PurchaseRequestUploadLogs;
}
