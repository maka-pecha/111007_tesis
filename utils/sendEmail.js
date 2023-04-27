const { ApiClient, TransactionalEmailsApi, SendSmtpEmail } = require("sib-api-v3-sdk");

module.exports = async ({ recipient, subject, message}) => {
    let defaultClient = ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.SENDGRID_API_KEY;

    let apiInstance = new TransactionalEmailsApi();

    let sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.name = "Email confirmation DonateOnNetwork";
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.sender = {"name": "Donate On Network", "email": "macupecha@gmail.com"};
    sendSmtpEmail.type = "classic";
    sendSmtpEmail.htmlContent = message;
    sendSmtpEmail.to = [{"email":recipient}];
    apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function(error) {
        console.error(error);
    });
}
