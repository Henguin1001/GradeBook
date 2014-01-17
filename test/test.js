var Gradebook = require('../gradebook');
var login = require('./login.secret.json');
var assert = require('assert');

describe('Gradebook', function() {
	// sorry cant supply a test username and password
	var gradebook = new Gradebook(login.username, login.password);

	describe('#startSession', function() {
		it('should run with no error if login is correct', function(done) {
			gradebook.startSession(done);
		});
		describe('#getDefault', function() {
			it('should run with no error, passing student assignments to the callback', function(done) {
				gradebook.getDefault(done);
			});
		});
		describe('#getGrades', function() {
			it('should run with no error, passing student grades to the callback', function(done) {
				gradebook.getGrades(done);
			});
		});
		describe('#endSession', function() {
			it('should run with no error', function(done) {
				gradebook.endSession();
				done();
			});
		});
	});
});