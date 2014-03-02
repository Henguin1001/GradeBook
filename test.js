var Gradebook = require('../gradebook');
var gradebook = new Gradebook('p158124', 'Henguin');
gradebook.startSession(function(err){
    if(!err){
        gradebook.getGrades(function(err,grades){
            if(!err){
                gradebook.getAssignments(grades,function(err,body){
                    if(!err){
                        var test = grades.map(function(value, index) {
                            value.firstSemester.assignments = body[index].firstSemester;
                            value.secondSemester.assignments = body[index].secondSemester;
                            
                            return value;
                        })
                        console.log(test);
                    }
                });
            }
        });
    }
});
