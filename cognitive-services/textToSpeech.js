module.exports = function(RED) {

	var request = require('request');
	var xmlContent = "<speak version='1.0' xml:lang='{locale}'><voice xml:lang='{locale}' xml:gender='{gender}' name='{name}'>{payload}</voice></speak>";
	var voices = require('./textToSpeechVoices.json');
		
	function authorizeBingSpeechAPI(node, msg, callback) {
		if (node.credentials == null || node.credentials.key == null || node.credentials.key == "") {
			node.error("Error with subscription key : null", msg);
			return;
		}

		if (node.bingSpeechAuth == undefined || node.bingSpeechAuthTime == undefined || Date.now() - node.bingSpeechAuthTime > 360000 /* 9mn = 360000ms*/ ) {
			var optionsToken = {
				url : 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
				method : 'POST',
				headers : {
					'Ocp-Apim-Subscription-Key' : node.credentials.key,
					'Content-Length' : '0'
				}
			};

			request.post(optionsToken, function(error, response, body) {
				if( error != undefined ) {
					node.error("Error with authentication : " + error, msg);
					return;
				}

				node.bingSpeechAuth = body;
				node.bingSpeechAuthTime = Date.now();

				callback();
			});

		} else {
			callback();
		}
	}

	function textToSpeechNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		node.on('input', function(msg) {
			if (msg.payload == null) {
				node.error("Error with payload : null", msg);
				return;
			}
			
			authorizeBingSpeechAPI(node, msg, function() {
				var options = {
					url : 'https://speech.platform.bing.com/synthesize',
					method : 'POST',
					headers : {
						'Authorization' : 'Bearer '	+ node.bingSpeechAuth,
						'X-Search-AppId' : config.appId,
						'X-Search-ClientID' : node.Id,
						'X-Microsoft-OutputFormat' : config.outputFormat,
						'User-Agent' : config.userAgent
					},
					body : xmlContent.replace(/\{(.+?)\}/g, function(match, index) {
						if( index == "payload" )
							return msg.payload;
					    return voices[config.voice][index];
					})
				};

				var res = request.post(options, function(error, response, body) {
					if( error != undefined ) {
						node.error("Error with text to speech : " + error, msg);
						return;
					}

					if( response == undefined || response == null ) {
						node.error("Error with text to speech : response is null", msg);
						return;
					}

					if( response.statusCode != '200' ) {
						node.error("Error with text to speech : response status - " + response, msg);
						return;
					}

					if( body == undefined || body == null ) {
						node.error("Error with text to speech : body is null", msg);
						return;
					}
					
					node.log("Text to speech result : OK");
				});
				if( config.outputPayloadType == "stream") {
					msg.payload = res;
					node.send(msg);
				} else {
					res.on('data', function(chunk) {
						msg.payload = chunk;
						msg.event = "data";
						node.send(msg);
					});
					res.on('end', function(chunk) {
						msg.payload = chunk;
						msg.event = "end";
						node.send(msg);
					});
				}
			});
		});
	}

	RED.nodes.registerType("Text To Speech", textToSpeechNode, {
		credentials : {
			key : {
				type : "password"
			}
		}
	});
}
