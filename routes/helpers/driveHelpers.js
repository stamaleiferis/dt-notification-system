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

const createCourseFolder = async (name) => {
  return await createFolder (name, rootFolderId)
}

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
  return {
    id: file.data.id, 
    webViewLink: file.data.webViewLink
  }
}

const deleteFile = async (fileId) => {
  await drive.files.delete({
    fileId: fileId
  })
}

const uploadPdf = async (name, parent, attachment) => {

  var fileMetadata = {
    name: name,
    parents: [parent]
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
  return {
    id: file.data.id,
    webViewLink: file.data.webViewLink
  }

}
exports.createFolder = createFolder
exports.deleteFile = deleteFile
exports.createCourseFolder = createCourseFolder
exports.uploadPdf = uploadPdf
