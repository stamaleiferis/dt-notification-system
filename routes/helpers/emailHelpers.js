const sendGrid = require('sendgrid').mail;
//const sg = require('sendgrid')(process.env.SENDGRID_KEY);
const sg = require('sendgrid')('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');


//const sg = require('@sendgrid/mail');
//sg.setApiKey(process.env.SENDGRID_API_KEY);

//console.log(process.env.SENDGRID_API_KEY)
const sendVerificationEmail = (to, token) => {
    //let link = `TODO/verification/${to}/${token}`;
    //let body= 'TODO'
    //let clickMe= `Click here to verify your email.`;
    //let title = `Welcome!`;
    const request = sg.emptyRequest({
        method: "POST",
        path: "/v3/mail/send",
        body: {
            personalizations: [
                {
                to: [
                    {
                    email: to
                    }
                ],
                subject:"Verify Your Email"
                }
            ],
            from: {
                email: "TODO@TODO.TODO"
            },
            content: [
                {
                    type: 'text/html',
                    value: 'corona'//emailBodyBuilder(body, title, clickMe, link)
                }
            ]
        }
    });
    return new Promise(function (resolve, reject) {
        sg.API(request, (error, response) => {
          console.log("API "+process.env.SENDGRID_API_KEY)

            if (error) {
                console.log('sendGrid error', error.response.body)
                return reject(error);
            }
            else {
                console.log("email is sent!");
                return resolve(response);
            }
        });
    });
  };

exports.sendVerificationEmail = sendVerificationEmail
