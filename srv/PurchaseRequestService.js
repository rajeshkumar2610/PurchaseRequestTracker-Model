import cds from '@sap/cds'
import * as XLSX from 'xlsx';

export class PurchaseRequestService extends cds.ApplicationService { init() {

  const { PurchaseRequestsSet, DepartmentsSet, ItemCategoriesSet,  PurchaseRequestAttachmentsSet } = cds.entities('PurchaseRequestService')
  const { SELECT, INSERT } = cds.ql;

  const { PurchaseRequests } =
      cds.entities('rajesh.db.transaction');

  const { PurchaseRequestUploadLogs } =
      cds.entities('rajesh.db.transaction');

// Master data used to validate Excel values
    const { Departments, ItemCategories } =
        cds.entities('rajesh.db.master');

function validatePurchaseRequestRow(row) {
    const errors = [];

    // Check required fields
    const requiredFields = [
        'requesterName',
        'requesterEmail',
        'department',
        'itemName',
        'itemCategory',
        'quantity',
        'estimatedAmount',
        'currency',
        'requiredByDate',
        'businessJustification'
    ];

    for (const field of requiredFields) {
        if (
            row[field] === undefined ||
            row[field] === null ||
            String(row[field]).trim() === ''
        ) {
            errors.push(`${field} is required`);
        }
    }

    // Quantity must be a valid number greater than zero
    if (
        !Number.isFinite(Number(row.quantity)) ||
        Number(row.quantity) <= 0
    ) {
        errors.push('Quantity must be a valid number greater than zero');
    }

    // Estimated amount must be a valid number greater than zero
    if (
        !Number.isFinite(Number(row.estimatedAmount)) ||
        Number(row.estimatedAmount) <= 0
    ) {
        errors.push('Estimated amount must be a valid number greater than zero');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}


function convertExcelDate(value) {
    if (value === '' || value === undefined || value === null) {
        return null;
    }
    

    // Excel date stored as a number
    if (typeof value === 'number') {
        return new Date(
            Date.UTC(1899, 11, 30) + value * 86400000
        ).toISOString().slice(0, 10);
    }

    // JavaScript Date object
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    // Date already provided as text
    return String(value).slice(0, 10);
}

  
  //Block for Creation Business rule
  this.before (['CREATE'], PurchaseRequestsSet, async (req) => {
    if (req.data.quantity <= 0) {
      req.error(400, 'Quantity must be greater than zero');
    } 
    if (req.data.estimatedAmount <= 0) {
      req.error(400, 'estimated amount must be greater than zero');
    } 
    if (req.data.requiredByDate < req.data.requestDate) {
      req.error(400, 'Required by date should not be earlier than request date');
    } 
    if (!req.data.status) {
        req.data.status = 'Submitted';
    } 
    if (req.data.status !== 'Submitted') {
        req.error(400, 'New purchase request must have status Submitted');
    } 
        
  })

  //Block for Approval Request
  this.on("approveRequest", async (req) => {
    //req.data will show the data which user pass in request BODY
    // console.log(req.data);
    //req.params will show the data in the request URL, in this case it will show the ID of the purchase request
    // console.log("PARAMS:", req.params);
    const requestId = req.params[0].ID;
    const request = await this.read(PurchaseRequestsSet, requestId);

    if (request.status !== 'Submitted') {
    req.error(400, 'Only submitted requests can be approved.');
    }
  await cds.tx(req).run(
    cds.ql.UPDATE('rajesh.db.transaction.PurchaseRequests')
      .set({
        status: 'Approved',
        approverEmail: req.data.approverEmail,
        approverRemarks: req.data.approverRemarks,
        approvalDate: new Date().toISOString().split('T')[0]
      })
      .where({ ID: requestId })
  );
  })


  //Block for Reject Request
  this.on("rejectRequest", async(req) =>{
    const requestId = req.params[0].ID;
    const request = await this.read(PurchaseRequestsSet, requestId);

    if (request.status !== 'Submitted') {
        req.error(400, 'Only submitted requests can be rejected.');
    }
  await cds.tx(req).run(
    cds.ql.UPDATE('rajesh.db.transaction.PurchaseRequests')
      .set({
        status: 'Rejected',
        approverEmail: req.data.approverEmail,
        approverRemarks: req.data.approverRemarks,
        approvalDate: new Date().toISOString().split('T')[0]
      })
      .where({ ID: requestId })
  );
  })

  //Security Filtering
  this.before(['READ'], PurchaseRequestsSet, async(req)=>{
    // Approvers and admins can see all requests
    if (
      req.user.is('PurchaseRequestApprover') ||
      req.user.is('PurchaseRequestAdmin')
    ) {
      return;
    } 
    console.log('Authenticated user ID:', req.user.id);
    console.log(
    'Has email attribute:',
    Boolean(req.user.attr?.email)
  );

    const email = req.user.attr.email;
    console.log('Authenticated user email:', email);

  if (!email) {
    return req.reject(403, 'User email is not configured');
  }

  req.query.where({ requesterEmail: email });
  })

 

    // Validate attachment metadata when an attachment is created.
    // Do not require size here: the UI may upload the binary separately.
   this.before('UPDATE', PurchaseRequestsSet, (req) => {
    const allowedMimeTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const MAX_SIZE = 5 * 1024 * 1024;

    const attachment = req.data.attachments?.[0];
    console.log(req.data.attachments);
    // This request doesn't contain attachment data.
    if (!attachment) {
        return;
    }

    const { mimeType, size} = attachment;
    console.log(attachment);
    if (!allowedMimeTypes.includes(mimeType)) {
        return req.reject(
            400,
            'Only PDF, TXT and Excel files are allowed for upload.'
        );
    }

    if (!Number.isFinite(size) || size <= 0) {
        return req.reject(400, 'A valid file size is required.');
    }

    if (size > MAX_SIZE) {
        return req.reject(400, 'File size must not exceed 5 MB.');
    }
    attachment.uploadedBy = req.user?.attr?.email || req.user?.id || 'unknown';

    attachment.uploadedAt = new Date();
});
    

    // 6. Prevent attachment deletion after the request is processed
    this.before('DELETE', PurchaseRequestAttachmentsSet.drafts, async (req) => {
    console.log('Attachment draft DELETE handler called');

    // The last parameter is the attachment ID.
    const attachmentId = req.params?.at(-1)?.ID;

    if (!attachmentId) {
        return req.reject(400, 'Attachment ID is required.');
    }

    // Find the attachment in the draft entity.
    const attachment = await SELECT.one
        .from(PurchaseRequestAttachmentsSet.drafts)
        .columns('purchaseRequest_ID')
        .where({ ID: attachmentId });

    if (!attachment) {
        return req.reject(404, 'Attachment was not found.');
    }

    const parentId = attachment.purchaseRequest_ID;

    // Check the active parent request.
    const activeRequest = await SELECT.one
        .from(PurchaseRequestsSet)
        .columns('status')
        .where({ ID: parentId });

    // Also check the draft parent request.
    const draftRequest = await SELECT.one
        .from(PurchaseRequestsSet.drafts)
        .columns('status')
        .where({ ID: parentId });

    if (
        activeRequest?.status !== 'Submitted' ||
        (draftRequest && draftRequest.status !== 'Submitted')
    ) {
        return req.reject(
            400,
            'Attachments can only be deleted while the purchase request is Submitted.'
        );
    }

    console.log('Attachment deletion allowed.');
});



//UPLOAD Purchase Request Excel
this.on('uploadPurchaseRequests', async (req) => {
    const { fileName, fileContent } = req.data;

    if (!fileName || !fileContent) {
        return req.reject(400, 'File name and content are required.');
    }

    if (!fileName.toLowerCase().endsWith('.xlsx')) {
        return req.reject(400, 'Please upload an .xlsx file.');
    }

    try {
        // Convert Base64 text into binary data
        const buffer = Buffer.from(fileContent, 'base64');

        // Read the Excel workbook
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Find the worksheet
        const worksheet = workbook.Sheets['PurchaseRequests'];

        if (!worksheet) {
            return req.reject(
                400,
                'Worksheet PurchaseRequests was not found.'
            );
        }

        // Convert worksheet rows into JavaScript objects
        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: ''
        });

        // console.log('Excel rows parsed:', rows.length);
        // console.log('All Excel rows:', rows);
        // console.log('First row:', rows[0]);

    // STEP 3: INSERT VALID EXCEL ROWS INTO DATABASE

    // Counters to track how many rows succeed and fail
    let successRows = 0;
    let failedRows = 0;

    // Create a database transaction for this upload request
    const tx = cds.tx(req);

    // Load departments and item categories from the database
    const departments = await tx.run(
        SELECT.from(Departments)
    );

    const itemCategories = await tx.run(
        SELECT.from(ItemCategories)
    );

    // Keep only active departments
    const activeDepartmentCodes = new Set(
        departments
            .filter(department => department.isActive === true)
            .map(department => department.code)
    );

    // Store all valid item-category codes
    const itemCategoryCodes = new Set(
        itemCategories.map(category => category.code)
    );

    // Generate one unique ID to identify this Excel upload
    const uploadId = cds.utils.uuid();

    // Read existing purchase request numbers from the database
    const existingRequests = await tx.run(
        SELECT.from(PurchaseRequests).columns('requestNo')
    );

    // Find the highest existing request number (example: PR-1004)
    // We will generate the next number from this value
    let maxNumber = 1000;

    for (const request of existingRequests) {
        // Extract the number from a request number like PR-1004
        const match = request.requestNo?.match(/^PR-(\d+)$/);

        if (match) {
            // Keep the highest number found
            maxNumber = Math.max(maxNumber, Number(match[1]));
        }
    }

    // Process every Excel row independently
    for (const [index, row] of rows.entries()) {

        // Step 3.1: Validate the current Excel row
        const result = validatePurchaseRequestRow(row);

        // Prepare the validation error message, if any
        let errorMessage = result.errors.join(', ');

        try {
            // Only valid rows are allowed to proceed to database insertion
            if (result.valid) {

                // Validate department code against active master data
                if (!activeDepartmentCodes.has(row.department)) {
                    throw new Error(
                        `Invalid or inactive department: ${row.department}`
                    );
                }

                // Validate item category against master data
                if (!itemCategoryCodes.has(row.itemCategory)) {
                    throw new Error(
                        `Invalid item category: ${row.itemCategory}`
                    );
                }
                
                // Use requestDate from Excel; if missing, use today's date
                const requestDate =
                    convertExcelDate(row.requestDate) ||
                    new Date().toISOString().slice(0, 10);

                // Convert the required delivery date from Excel format
                const requiredByDate =
                    convertExcelDate(row.requiredByDate);

                    console.log('Row:', index + 1);
                    console.log('Request date:', requestDate);
                    console.log('Required date:', requiredByDate);
                    
                // Business rule: required date cannot be before request date
                if (requiredByDate < requestDate) {
                    throw new Error(
                        'Required by date cannot be earlier than request date'
                    );
                }

                // Generate a new request number, such as PR-1005
                const requestNo = `PR-${++maxNumber}`;

                // Prepare the data that will be saved in PurchaseRequests
                const entry = {
                    requestNo: requestNo,
                    requesterName: row.requesterName,
                    requesterEmail: row.requesterEmail,
                    department_code: row.department,
                    itemName: row.itemName,
                    itemCategory_code: row.itemCategory,
                    quantity: Number(row.quantity),
                    estimatedAmount: Number(row.estimatedAmount),
                    currency: row.currency,
                    requestDate: requestDate,
                    requiredByDate: requiredByDate,
                    businessJustification: row.businessJustification,

                    // Every newly uploaded request starts as Submitted
                    status: 'Submitted'
                };

                // Insert the prepared purchase request into the database
                await tx.run(
                    INSERT.into(PurchaseRequests).entries(entry)
                );

                // Count success only after the database insert succeeds
                successRows++;

                console.log(
                    `Row ${index + 1}: Inserted successfully (${requestNo})`
                );

            } else {
                // Validation failed: stop this row from being inserted
                throw new Error(errorMessage);
            }

        } catch (error) {
            // This row failed validation or database insertion
            failedRows++;

            // Capture the reason for the failure
            errorMessage = error.message || 'Database insert failed';

            console.log(
                `Row ${index + 1}: Failed - ${errorMessage}`
            );

            // Save the failed row's details in the upload log table
            await tx.run(
                INSERT.into(PurchaseRequestUploadLogs).entries({
                    ID: cds.utils.uuid(),
                    uploadId: uploadId,
                    rowNumber: index + 1,
                    status: 'Failed',
                    errorMessage: errorMessage.slice(0, 1000)
                })
            );
        }
    }

    // Return the final upload summary to Postman or the UI
    return {
        totalRows: rows.length,
        successRows: successRows,
        failedRows: failedRows,
        message: 'Excel upload processing completed.'
    };

          } catch (error) {
            // Log the actual reason the upload failed
            console.error('Purchase request upload failed:', error);

            return req.reject(
                500,
                'Purchase request upload failed. Check the server logs.'
            );
        }
      });
// Condition	Expected Recommendation
// estimatedAmount <= 25000 and attachment exists	decision = Recommended, riskLevel = Low, approver = Manager
// estimatedAmount > 25000 and <= 100000	decision = ReviewRequired, riskLevel = Medium, approver = Senior Manager
// estimatedAmount > 100000	decision = ReviewRequired, riskLevel = High, approver = Director
// itemCategory = SOFTWARE and businessJustification is short/missing	decision = ReviewRequired, riskLevel = Medium, message = Need detailed software justification
// requiredByDate is within next 3 days	riskLevel should be increased because it is urgent


    this.on('getApprovalRecommendation', async (req) => {

        const requestId = req.params[0].ID;
        console.log(requestId);
        const request = await this.read(PurchaseRequestsSet, requestId);
        console.log(request);

        if (!request) {
            return req.reject(404, "Purchase request not found");
        }

        // Only submitted requests can receive a recommendation
        if (request.status !== 'Submitted') {
            return req.reject(
                400,
                'Approval recommendation is available only for submitted requests'
            );
        }

        //Check whether attachment exist
        const attachment = await SELECT.one
            .from(PurchaseRequestAttachmentsSet)
            .where({
                purchaseRequest_ID: requestId
            });

        const hasAttachment = Boolean(attachment);
        console.log('Has attachment:', hasAttachment);

         // 2.  Set default values
        let decision = 'ReviewRequired';
        let riskLevel = 'Medium';
        let suggestedApproverLevel = 'Manager';
        let message = 'Manual review is required.';


        //Date diff calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const requiredDate = new Date(
            `${request.requiredByDate}T00:00:00`
        );

        const diffTime = requiredDate.getTime() - today.getTime();

        const diffDays = Math.ceil(
            diffTime / (1000 * 60 * 60 * 24)
        );

        console.log(`Days remaining: ${diffDays}`);

        //Check the amount
        if (request.estimatedAmount <= 25000 && hasAttachment) {
            decision = 'Recommended';
            riskLevel = 'Low';
            suggestedApproverLevel = 'Manager';
            message = 'Low-value request with attachment.';
        } else if (request.estimatedAmount <= 100000) {
            decision = 'ReviewRequired';
            riskLevel = 'Medium';
            suggestedApproverLevel = 'Senior Manager';
            message = 'Senior Manager review is required.';
        } else {
            decision = 'ReviewRequired';
            riskLevel = 'High';
            suggestedApproverLevel = 'Director';
            message = 'Director review is required.';
        }
        //Check the software justification
        if (request.itemCategory_code === 'SOFTWARE' && (request.businessJustification || '').trim().length < 30 ) {
            decision = 'ReviewRequired';
            riskLevel = 'Medium';
            message = 'Need detailed software justification';
        }
        //Check Urgency
        if (diffDays >= 0 && diffDays <= 3) {
            decision = 'ReviewRequired';

            if (riskLevel === 'Low') {
                riskLevel = 'Medium';
            } else if (riskLevel === 'Medium') {
                riskLevel = 'High';
            }

            message += ' The request is urgent.';
        }

        //Return the result
        return {
            decision,
            riskLevel,
            suggestedApproverLevel,
            message
        };
    });


  return super.init()
}

}















// this.before('*', '*', (req) => {
//     console.log('========== CREATE INTERCEPTED ==========');
//     console.log('Target:', req.target?.name);
//     console.log('Data:', JSON.stringify(req.data));
//     console.log('Params:', JSON.stringify(req.params));
// });