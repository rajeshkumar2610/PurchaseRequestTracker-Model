import cds from '@sap/cds'

export class PurchaseRequestService extends cds.ApplicationService { init() {

  const { PurchaseRequestsSet, DepartmentsSet, ItemCategoriesSet,  PurchaseRequestAttachmentsSet } = cds.entities('PurchaseRequestService')

  const { SELECT } = cds.ql;
  
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

// this.on("approveRequest", async (req) =>{

//   if(estimatedAmount > 25000 && estimatedAmount <= 100000){
//     	decision = ReviewRequired, riskLevel = Medium, approver = Senior Manager
//   }
// })


  return super.init()
}

}















// this.before('*', '*', (req) => {
//     console.log('========== CREATE INTERCEPTED ==========');
//     console.log('Target:', req.target?.name);
//     console.log('Data:', JSON.stringify(req.data));
//     console.log('Params:', JSON.stringify(req.params));
// });