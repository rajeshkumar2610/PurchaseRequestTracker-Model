using PurchaseRequestService as service from '../../srv/PurchaseRequestService';

annotate service.PurchaseRequestsSet with @(

    UI.HeaderInfo:{
        TypeName : 'Purchase Request',
        TypeNamePlural: 'Purchase Requests',
        Title:{Value:requestNo},
        Description:{Value:requesterName}
        },

    UI.SelectionFields: [
        requestNo,
        requesterEmail,
        department_code,
        itemCategory_code,
        status,
        requestDate
    ],

    UI.LineItem       : [
        {
            $Type : 'UI.DataField',
            Value : ID,
        },
        {
            $Type: 'UI.DataField',
            Value: requestNo,
        },
        {
            $Type: 'UI.DataField',
            Value: requesterName,
        },
        {
            $Type : 'UI.DataField',
            Value : itemName,
        },
        {
            $Type: 'UI.DataField',
            Value: department_code,
        },
        {
            $Type: 'UI.DataField',
            Value: itemCategory_code,
        },
        {
            $Type: 'UI.DataField',
            Value: quantity,
        },
        {
            $Type: 'UI.DataField',
            Value: estimatedAmount,
        },
        {
            $Type: 'UI.DataField',
            Value: currency,
        },
        {
            $Type: 'UI.DataField',
            Value: requestDate,
        },
        {
            $Type: 'UI.DataField',
            Value: requiredByDate,
        },
        {
            $Type: 'UI.DataField',
            Value: status,
        }
    ],
    UI.Facets         : [{
        $Type : 'UI.CollectionFacet',
        Label : 'Details',
        Facets: [
            {
                $Type : 'UI.ReferenceFacet',
                Target: '@UI.Identification',
                Label:'Request Header'
            },
            {
                $Type : 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#Item_Details',
                Label : 'Item Details',
            },
            {
                $Type : 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#Approval_Details',
                Label:'Approval Details'
            },
            {
                $Type : 'UI.ReferenceFacet',
                Target : '@UI.FieldGroup#Audit_Details',
                Label:'Audit Details'
            },
            {
                $Type : 'UI.ReferenceFacet',
                Target : 'attachments/@UI.LineItem',
                Label : 'Attachments'
            }
        ]
    } ],

    UI.Identification:[
        {
            $Type : 'UI.DataField',
            Value : requestNo,
        },
        {
            $Type : 'UI.DataField',
            Value : requesterName,
        },
        {
            $Type : 'UI.DataField',
            Value : requesterEmail,
        },
        {
            $Type : 'UI.DataField',
            Value : department_code,
        },
        {
            $Type : 'UI.DataField',
            Value : requestDate,
        },
        {
            $Type : 'UI.DataField',
            Value : status,
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'PurchaseRequestService.approveRequest',
            Label : 'Approve',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'PurchaseRequestService.rejectRequest',
            Label : 'Reject',
        },
    ],
    UI.FieldGroup #Item_Details : {
        Data : [
            {
                $Type : 'UI.DataField',
                Value : itemName,
            },
            {
                $Type : 'UI.DataField',
                Value : itemCategory_code,
            },
            {
                $Type : 'UI.DataField',
                Value : quantity,
            },
            {
                $Type : 'UI.DataField',
                Value : estimatedAmount,
            },
            {
                $Type : 'UI.DataField',
                Value : currency,
            },
            {
                $Type : 'UI.DataField',
                Value : requiredByDate,
            },
            {
                $Type : 'UI.DataField',
                Value : businessJustification,
            },
        ]
    },
    UI.FieldGroup #Approval_Details : {
        $Type : 'UI.FieldGroupType',
        Data:[
            {
                $Type : 'UI.DataField',
                Value : approverEmail,
            },
            {
                $Type : 'UI.DataField',
                Value : approvalDate,
            },
            {
                $Type : 'UI.DataField',
                Value : approverRemarks,
            },
        ]
    },
    UI.FieldGroup #Audit_Details : {
        $Type : 'UI.FieldGroupType',
        Data :[
            {
                $Type : 'UI.DataField',
                Value : createdAt,
            },
            {
                $Type : 'UI.DataField',
                Value : createdBy,
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedAt,
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedBy,
            },
        ]
        
    },


)

{
    @Common.ValueListWithFixedValues : true
    department @Common.ValueList:{
        Label:'Department',
        CollectionPath: 'DepartmentsSet',
        Parameters:[
            {
                $Type: 'Common.ValueListParameterInOut', 
                LocalDataProperty: department_code, 
                ValueListProperty: 'code'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly', 
                ValueListProperty: 'name' 
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly', 
                ValueListProperty: 'isActive' 
            }

      ]
    };


    @Common.ValueListWithFixedValues: true
    itemCategory @Common.ValueList: {
        Label: 'Item Category',
        CollectionPath: 'ItemCategoriesSet',
        Parameters: [
            {
                $Type: 'Common.ValueListParameterInOut',
                LocalDataProperty: itemCategory_code,
                ValueListProperty: 'code'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'description'
            }
        ]
    };
}


annotate service.PurchaseRequestAttachmentsSet with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : content,
            Label : 'File'
        },
        {
            $Type : 'UI.DataField',
            Value : fileName,
            Label : 'File Name'
        },
        {
            $Type : 'UI.DataField',
            Value : mimeType,
            Label : 'File Type'
        },
        {
            $Type : 'UI.DataField',
            Value : size,
            Label : 'File Size (Bytes)'
        },
        {
            $Type : 'UI.DataField',
            Value : uploadedBy,
            Label : 'Uploaded By'
        },
        {
            $Type : 'UI.DataField',
            Value : uploadedAt,
            Label : 'Uploaded At'
        }
    ]
);