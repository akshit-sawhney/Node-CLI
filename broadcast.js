"use strict";
const commander = require('commander');
const csv = require('csv');
const fs = require('fs');
const inquirer = require('inquirer');
const async = require('async');

commander
	.version('0.0.1')
	.option('-l, --list [list]', 'list of customers in CSV file')
	.parse(process.argv)

let questions = [
	{
		type: "input",
		name: "sender.email",
		message: "Sender's Email Address - "
	},
	{
		type: "input",
		name: "sender.name",
		message: "Sender's Name - "
	},
	{
		type: "input",
		name: "subject",
		message: "Subject "
	}
];

let contactList = [];
let parse = csv.parse;
let stream = fs.createReadStream(commander.list)
	.pipe(
		parse(
			{
				delimiter: ','
			}
		)
	);

let __sendEmail = function (to, from, subject, callback) {
  let template = "Wishing you a Merry Christmas and a " +
    "prosperous year ahead. P.S. Toby, I hate you.";
  let helper = require('sendgrid').mail;
  let fromEmail = new helper.Email(from.email, from.name);
  let toEmail = new helper.Email(to.email, to.name);
  let body = new helper.Content("text/plain", template);
  let mail = new helper.Mail(fromEmail, subject, toEmail, body);

  let sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
	console.log(process.env.SENDGRID_API_KEY);
  let request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request, function(error, response) {
		console.log(error);
    if (error) { return callback(error); }
    callback();
  });
};

stream
  .on("error", function (err) {
    return console.error(err.response);
  })
  .on("data", function (data) {
    let name = data[0] + " " + data[1];
    let email = data[2];
    contactList.push({ name : name, email : email });
  })
  .on("end", function () {
    inquirer.prompt(questions).then(function (ans) {
      async.each(contactList, function (recipient, fn) {
        __sendEmail(recipient, ans.sender, ans.subject, fn);
      });
    });
  });