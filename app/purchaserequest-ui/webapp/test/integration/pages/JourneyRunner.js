sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"rajesh/ui/purchaserequestui/test/integration/pages/PurchaseRequestsSetList.gen",
	"rajesh/ui/purchaserequestui/test/integration/pages/PurchaseRequestsSetObjectPage.gen"
], function (JourneyRunner, PurchaseRequestsSetListGenerated, PurchaseRequestsSetObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('rajesh/ui/purchaserequestui') + '/test/flp.html#app-preview',
        pages: {
			onThePurchaseRequestsSetListGenerated: PurchaseRequestsSetListGenerated,
			onThePurchaseRequestsSetObjectPageGenerated: PurchaseRequestsSetObjectPageGenerated
        },
        async: true
    });

    return runner;
});

