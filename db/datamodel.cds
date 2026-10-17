using { cuid,managed} from '@sap/cds/common';

//unique name for project
namespace rajesh.db;

context transaction {
    entity PurchaseRequests  : cuid, managed {
        requestNo             : String(20) @title: '{i18n>requestNo}';
        requesterName         : String(100)@title: '{i18n>requesterName}';
        requesterEmail        : String(100)@title: '{i18n>requesterEmail}';
        department            : Association to master.Departments @title: '{i18n>department}';
        itemName              : String(100)@title: '{i18n>itemName}';
        itemCategory          : Association to master.ItemCategories @title: '{i18n>itemCategory}';
        quantity              : Integer@title: '{i18n>quantity}';
        estimatedAmount       : Decimal(15, 2)@title: '{i18n>estimatedAmount}';
        currency              : String(3)@title: '{i18n>currency}';
        requestDate           : Date@title: '{i18n>requestDate}';
        requiredByDate        : Date@title: '{i18n>requiredByDate}';
        businessJustification : String(500)@title: '{i18n>businessJustification}';
        status                : String(20)@title: '{i18n>status}';
        approverEmail         : String(100)@title: '{i18n>approverEmail}';
        approvalDate          : Date@title: '{i18n>approvalDate}';
        approverRemarks       : String(500)@title: '{i18n>approverRemarks}';
    }
     entity PurchaseRequestReport
        as select from PurchaseRequests {
            key department,
            key status,
            count(*)            as totalRequests : Integer,
            sum(estimatedAmount) as totalAmount   : Decimal(15,2)
        }
        group by department, status;
}

context master {
    entity Departments {
        key code     : String(10);
            name     : String(100);
            isActive : Boolean;


    }

    entity ItemCategories {
        key code        : String(20);
        description : String(100);


    }
}


