A node module allowing for access to the Bellevue School District gradebook
#Install it
Using npm just `npm install gradebook`
# How to use it
## Start a session
``` js
var Gradebook = require('../gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		// you've logged in
	}
});
```
## Access the default page
it holds the the overdue, due, and soon to be due assignments
``` js
var Gradebook = require('../gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		gradebook.getDefault(function(err,body){
			if(!err){
				console.log(body);
			}
		});
	}
});
```
## Access the grades page
Of course it holds the user's grades
``` js
var Gradebook = require('../gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		gradebook.getGrades(function(err,body){
			if(!err){
				console.log(body);
			}
		});
	}
});
```
## Get the assignments for each course
``` js
var Gradebook = require('../gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		gradebook.getGrades(function(err,grades){
			if(!err){
				gradebook.getAssignments(grades,function(err,body){
					if(!err){
						console.log(body);
					}
				});
			}
		});
	}
});
```
## End the session
Of course it holds the user's grades
``` js
var Gradebook = require('../gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	gradebook.endSession();
});
```