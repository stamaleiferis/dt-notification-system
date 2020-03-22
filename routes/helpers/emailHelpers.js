const sg = require('@sendgrid/mail');
sg.setApiKey('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');

const sendEmail = (emails,from,subject,body,html) => {
  console.log("SendEmail")
  console.log(emails)
  const msg = {
  to: emails,
  from: from,
  subject: subject,
  text: body,
  html: html,
  };
  sg.send(msg,true);

}

exports.sendVerificationEmail = sendVerificationEmail
exports.sendEmail = sendEmail
