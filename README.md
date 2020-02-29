# ec2-backend-test
Express app, hooked up to a mongo database that is deployed on EC2 instance with DNS --> `http://ec2-3-94-208-166.compute-1.amazonaws.com:3000`
* The server will return json response. It is not hooked up to a view engine.

**APIS**

__HEALTH CHECKS__
1. /testConnection
{"message":"connection is working!"}
