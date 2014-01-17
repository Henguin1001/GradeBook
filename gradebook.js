/////////////////////////////////////////////////////////////////////
//@author Henry Troutman, henguin1001@gmail.com, henrytroutman.com //
/////////////////////////////////////////////////////////////////////

/**
 * constructs the object used to make requests to the gradebook
 * @constructor
 * @param {string} username - the name of the user
 * @param {string} password - and their password
 *
 */
function GradeBook(username, password) {
	// using the request module for http requests
	this.request = require('request');
	// telling it to keep the cookies
	// without it a login would be prompted at each request
	this.jar = this.request.jar();
	// these are the hidden fields of the login page
	this.fields = {
		'__LASTFOCUS': '',
		'__EVENTTARGET': '',
		'__EVENTARGUMENT': '',
		'__VIEWSTATE': '/wEPDwUJNTkxNzI3MDIzD2QWAmYPZBYCAgMPZBYGAgEPZBYCAgkPZBYCAgEPZBYIAgMPFgIeB1Zpc2libGVoZAIFDxYCHwBoZAIHDxYCHwBoZAIJDxYCHgVzdHlsZQUjdmVydGljYWwtYWxpZ246bWlkZGxlO2Rpc3BsYXk6bm9uZTtkAgMPDxYCHwBoZGQCBQ9kFghmD2QWAgINDxYCHgVjbGFzcwUQc2luZ2xlU2Nob29sTGlzdBYCAgEPZBYCAgEPEGQPFgFmFgEQBQ5EZWZhdWx0IERvbWFpbgUIUGlubmFjbGVnZGQCAg9kFgICEw9kFgICAQ9kFgICAQ8QZGQWAGQCBw8PFgIeBFRleHQFIFBpbm5hY2xlIEdyYWRlIDIwMTIgV2ludGVyIEJyZWFrZGQCCA8PFgIfAwU3Q29weXJpZ2h0IChjKSAyMDEzIEdsb2JhbFNjaG9sYXIuICBBbGwgcmlnaHRzIHJlc2VydmVkLmRkZOyavVRjF60WtD168prqyKT3U8Z0',
		'__EVENTVALIDATION': '/wEWBgKbqrX2CwLnksmgAQKTpbWbDgLB5+KIBAL4xb20BAK20ZqiCVo5iBSaTt9D6CP/np3mnWAl1Hw4',
		'ctl00$ContentPlaceHolder$lstDomains': 'Pinnacle',
		'ctl00$ContentPlaceHolder$LogonButton': 'Sign in',
		'PageUniqueId': 'c0b81baa-d2fc-4737-a4ef-4db5e94eb891'
	};
	// add the proper username and password to these fields
	this.fields['ctl00$ContentPlaceHolder$Username'] = username;
	this.fields['ctl00$ContentPlaceHolder$Password'] = password;

	// grab our dom parser?
	this.cheerio = require('cheerio');
	/**
	 * removes all ties of an array to cheerio
	 * @param  {object} cheerio_object - an object resulting from using $()
	 * @return {array} - an array with all the cheerio fields removed
	 */
	this.cheerio.seperate = function(cheerio_object) {
		var output = [];
		for (var key in cheerio_object) {
			if (parseInt(key) >= 0) output.push(cheerio_object[key]);
		}
		return output;
	};
}

/**
 * Starts the communication with the gradebook
 * @param  {Function} callback - called after the request is made
 *
 */
GradeBook.prototype.startSession = function(callback) {
	// make a request to the login page with the form data stored as this.fields
	this.request.post('https://grades.bsd405.org/Pinnacle/Gradebook/Logon.aspx?ReturnUrl=%2fpinnacle%2fgradebook%2fDefault.aspx', {
		jar: this.jar
	}, function(err, response) {
		if (!err) {
			// check if there was a problem with logging in
			// if it was correct then it will say object moved
			if (response.body.indexOf("Object moved") != -1) {
				callback(undefined);
			} else {
				callback(new Error("Username or password was incorrect."));
			}
		} else {
			callback(err);
		}
	}).form(this.fields);
}

/**
 * Gets the "Default" page of the gradebook
 * it store the assignments that are overdue, due, and soon to be due
 * @param  {Function} callback
 */
GradeBook.prototype.getDefault = function(callback) {
	// preserve cheerio
	var cheerio = this.cheerio;
	this.request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/Default.aspx', {
		jar: this.jar
	}, function(err, response) {
		// was there an error in the request
		if (!err) {
			// the response is the html page
			// its time to parse

			// cheerio acts like jQuery but for node
			var $ = cheerio.load(response.body),
				// a group of tables
				tables = $('.reportTable'),
				// before just means it is still in dom form
				// the first table - overdue assignments
				overdue_before = tables[0],
				// the second - currently due
				due_before = tables[1],
				// and the third - future due
				future_before = tables[2],
				// the arrays that will store the pure form of each of said tables
				overdue = [],
				due = [],
				future = [];
			/**
			 * A function that takes the necessary information from a table
			 * @param  {object} table - the table to draw the info from
			 * @return {array} - an array of each assignment in the given table
			 */
			var parseTable = function(table) {
				// for some reason the "tbody" tag is converted to "table" 
				var output = $(table).children('table tr').map(function(index, value) {
					// each element that holds info
					var date = $(value).children()[0],
						assignment = $(value).children()[1],
						course = $(value).children()[2];
					// lets store that info
					var date_text = $(date).text(),
						assignment_text = $(assignment).text(),
						course_text = $(course).text();
					// return it all with the respective field names
					return {
						"date": date_text,
						"assignment": assignment_text,
						"course": course_text
					};
				});
				// there are a bunch of unnecessary fields from cheerio, this will remove them
				return cheerio.seperate(output);

			};

			// utilize parseTable for each of the three tables
			overdue = parseTable(overdue_before);
			due = parseTable(due_before);
			future = parseTable(future_before);

			// now call the callback with each table and its field
			callback(undefined, {
				"overdue": overdue,
				"due": due,
				"future": future
			});
		} else {
			// retreat!
			callback(err);
		}

	});
}

/**
 * Gets The enrolled classes, their grades, and where to access the assignments
 * @param  {Function} callback
 */
GradeBook.prototype.getGrades = function(callback) {
	// preserve cheerio
	var cheerio = this.cheerio;
	// make the request to the GradeSummary page
	this.request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/GradeSummary.aspx', {
		jar: this.jar
	}, function(err, response) {
		// was their an error in the request
		if (!err) {
			// again cheerio is like jQuery, passing it the html
			var $ = cheerio.load(response.body);

			/**
			 * A function that takes the necessary information from a table
			 * @param  {object} table - the table to draw the info from
			 * @return {array} - an array of each assignment in the given table
			 */
			var parseTable = function(table) {
				// this one retains the "tbody" tag?
				var output = $(table).children('tbody').children().map(function(index, value) {
					// get the elements holding the data
					var course = $(value).children()[0],
						period = $(value).children()[1],
						firstSemester = $(value).children()[2],
						secondSemester = $(value).children()[3];
					// extract and store the data
					var course_text = $(course).text(),
						period_text = $(period).text(),
						firstSemester_text = $(firstSemester).text(),
						secondSemester_text = $(secondSemester).text();
					// return it all with the respective field names
					return {
						"course": course_text,
						"period": period_text,
						"firstSemester": {
							"grade": firstSemester_text,
							"url": $(firstSemester).children('a').attr('href')
						},
						"secondSemester": {
							"grade": secondSemester_text,
							"url": $(secondSemester).children('a').attr('href')
						}
					};
				});
				// once again remove the fields from cheerio
				return cheerio.seperate(output);
			};


			// we have are table element
			var grades_before = $('.reportTable')[0],
				// and now all the data from it
				grades = parseTable(grades_before);
			// lets send the result back
			callback(undefined, grades);
		} else {
			// retreat!
			callback(err);
		}
	});
}
/**
 * refreshes the cookie jar
 */
GradeBook.prototype.endSession = function() {
	// reset that cookie
	this.jar = this.request.jar();
};


/**
 * pass the constructor
 * @type {function}
 */
module.exports = GradeBook;