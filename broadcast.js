#!/usr/bin/env node

"use strict";
var accountSid = 'ACed1648aa54de881d226b77588c664738';
var authToken = '6bdee499af24a2d0bbf4fc48aefe4a00';
const commander = require('commander');
const csv = require('csv');
const fs = require('fs');
const inquirer = require('inquirer');
const async = require('async');
const chalk = require('chalk');
const twilio = require('twilio');

commander
	.version('0.0.1')
	.option('-l, --list [list]', 'list of customers in CSV file')
  .option('-s, --sms', 'Send some smss')
	.parse(process.argv);

if(commander.list) {
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
  var obj;
  fs.readFile(commander.list, 'utf8', function (err, data) {
    if (err) throw err;
    obj = JSON.parse(data);
    let counter = 0;
    Object.keys(obj).forEach(function (key) {
      let individualObject = obj[key];
      contactList[counter] = individualObject;
      counter++;
    });
    inquirer.prompt(questions).then(function (ans) {
        async.each(contactList, function (recipient, fn) {
          __sendEmail(recipient, ans.sender, ans.subject, fn);
        }, function (err) {
          if (err) {
            return console.error(chalk.red(err.message));
          }
          console.log(chalk.green('Success'));
        });
      });
  });

  let __sendEmail = function (to, from, subject, callback) {
    let template = "Glory Glory Man United..... And the reds go marching on and on and on!!!!";
    let helper = require('sendgrid').mail;
    let fromEmail = new helper.Email(from.email, from.name);
    let toEmail = new helper.Email(to.email, to.name);
    let body = new helper.Content("text/plain", template);
    let mail = new helper.Mail(fromEmail, subject, toEmail, body);

    let sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
    let request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON(),
    });

    sg.API(request, function(error, response) {
      if (error) { return callback(error); }
      callback();
    });
  };

} else if(commander.sms) {
  let twilQuestions = [
    {
      type: "input",
      name: "twil.number",
      message: "Recipient's Phone Number: "
    },
    {
      type: "input",
      name: "twil.body",
      message: "SMS Body: "
    }
  ];
  var client = new twilio.RestClient(accountSid, authToken);
  inquirer.prompt(twilQuestions).then(function (ans) {
    client.messages.create({
      body: ans.twil.body,
      to: ans.twil.number,  // Text this number
      from: '+17739806935' // From a valid Twilio number
    }, function(err, message) {
    });
  });
}