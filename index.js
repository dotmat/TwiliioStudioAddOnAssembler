"use strict";
var request = require('request');
const fs = require('fs');

var twilioAccountSID = ''; // Put your AccountSID here
var twilioAuthToken = ''; // Put your AuthToken here
var studioWorkflowSID = ''; // Put your Studio workflow here
var engagementURL = 'https://studio.twilio.com/v1/Flows/'+studioWorkflowSID+'/Engagements';
var engagementSids = [];
var engagementDictionary = {};

// This script will get all the engagement context from a Studio work flow.
// Im using Request because the Twilio API is only cURL enabled for this data request and the page is more than 3 pages deep!


var options = {
  url: engagementURL,
  headers: {
    'User-Agent': 'D0tMat'
  },
  'auth': {
    'user': twilioAccountSID,
    'pass': twilioAuthToken,
    'sendImmediately': true
  }
};

function engagementCallback(error, response, body) {
  var info = JSON.parse(body);
  // For each engagement we need to log the sid into an array.
  var engagements = info.engagements;
  for (var i = 0, len = engagements.length; i < len; i++) {
    //someFn(arr[i]);
    //console.log(engagements[i].sid);
    engagementSids.push(engagements[i].sid);
  }
  console.log('Reading from page '+info.meta.page);
  //console.log(info);
  // If it contains the 'next_page_url' then update the URL and call again.
  if(info.meta.next_page_url){
    //console.log(info.meta.next_page_url);
    //engagementURL = info.meta.next_page_url;
    var options = {
      url: info.meta.next_page_url,
      headers: {
        'User-Agent': 'D0tMat'
      },
      'auth': {
        'user': twilioAccountSID,
        'pass': twilioAuthToken,
        'sendImmediately': true
      }
    };
    request(options, engagementCallback);
  } else {
    // For each engagement sid we need to grab the lookup context and create a dictionary of number to lookup data
    // The phone number is going to be the key and will have three arrays; whitepages pro, twilio caller name, twilio carrier info.
    for (var i = 0, len = engagementSids.length; i < len; i++) {
      var contextURL = 'https://studio.twilio.com/v1/Flows/'+studioWorkflowSID+'/Engagements/'+engagementSids[i]+'/Context';
      //console.log(contextURL);
       var options = {
         url: contextURL,
         headers: {
           'User-Agent': 'D0tMat'
         },
         'auth': {
           'user': twilioAccountSID,
           'pass': twilioAuthToken,
           'sendImmediately': true
         }
       };
       //sleep(100);
       request(options, function (error, response, body) {
         //console.log('Context Error:', error);
         //console.log('statusCode:', response && response.statusCode);
         //console.log('Context Body:', body);
         if (error) {
           console.log('Context Error:', error);
         }
         if(body){
           try {
             var contextJSON = JSON.parse(body);
             //console.log(contextJSON);
             // From context we want to extract the phonenumber
             var phoneNumber = contextJSON.context.contact.channel.address;
             console.log(phoneNumber);
             try {
               var addOnData = contextJSON.context.trigger.message.AddOns.results
               console.log(addOnData);
               // Push both the nunber and the add on data to an dict
               //engagementDictionary[phoneNumber.toString()] = JSON.stringify(addOnData);
               fs.appendFile('log.txt',"\""+phoneNumber+"\""+":"+JSON.stringify(addOnData)+",\n", (err) => {
                 if (err) throw err;
                 console.log('Added Phone number and AddOn Data to Log file.');
               });
             } catch(err){
               console.log('Addon Error: '+err);
             }
           }
           catch(err) {
             console.log('Number Error: '+err);
           }
         }
       });
    }
  }
}

// Kick off the initial request
request(options, engagementCallback);
