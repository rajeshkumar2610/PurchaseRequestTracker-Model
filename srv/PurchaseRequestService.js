import cds from '@sap/cds'

export class PurchaseRequestService extends cds.ApplicationService { init() {

  const { PurchaseRequestsSet, DepartmentsSet, ItemCategoriesSet } = cds.entities('PurchaseRequestService')


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


  return super.init()
}}
