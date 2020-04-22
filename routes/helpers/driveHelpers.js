const credentials = require('./credentials.json');
const { google } = require('googleapis');
const scopes = [
  'https://www.googleapis.com/auth/drive'
];
const auth = new google.auth.JWT(
  credentials.client_email, null,
  credentials.private_key, scopes
);
const drive = google.drive({ version: "v3", auth });
const rootFolderId = "1Me9rIsA9i6ifOoRXf17xvpFk3WUQw-Yh" //top level directory for the whole school

const createFolder = async (name, parent) => {

  var fileMetadata = {
  name: name,
  mimeType: 'application/vnd.google-apps.folder',
  parents: [parent]
  };

  var file = await drive.files.create({
    resource: fileMetadata,
    fields: '*'
  });

  return [file.data.id, file.data.webViewLink]
}

const uploadPdf = async (name, type, parent, attachment) => {

  var fileMetadata = {
  name: name
  };
  var media = {
    mimeType: 'application/vnd.google-apps.file',
    body: attachment
  };

  var file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  })
  console.log(file)
  return file.data.id

}
exports.createFolder = createFolder
