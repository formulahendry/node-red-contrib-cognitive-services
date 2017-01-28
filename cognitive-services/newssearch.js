var request = require('request');
var getURI = function (body, result)
{
    var urls = [];
    var counter = 0;
    body.value.forEach(function(element, index)
    {
         var options2 = {
             url: element.url,
             method: 'GET'
         };

         request(options2, function (error2, response2, body2)
         {
             try
             {
                 if (!error2)
                 {
                     if (response2.statusCode == 200 && body2 != null && response2.request.uri.href != null)
                     {
                         urls[index] = {
                             name: body.value[index].name,
                             url: response2.request.uri.href
                         };
                     }
                 }
             } catch (e) {}
             if (++counter == body.value.length)
             {
                 result(urls);
             }
         });
    });
};

module.exports = function(RED)
{
    function newssearch(config)
    {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg)
        {
            console.log("config.operation=" + config.operation);
            if (this.credentials == null || this.credentials.key == null || this.credentials.key == "")
            {
                node.error("Input subscription key", msg);
                console.log("Input subscription key");
            }
            else
            {
                if (config.operation == "search") // Search
                {
                    var options = {
                        url: 'https://api.cognitive.microsoft.com/bing/v5.0/news/search?q=' + encodeURI(msg.payload),
                        method: 'GET',
                        headers: {
                            'Ocp-Apim-Subscription-Key': this.credentials.key
                        }
                    };

                    //console.log("options=" + JSON.stringify(options));   
                    request(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                try { body = JSON.parse(body); } catch (e) {}
                                console.log("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                                if (response.statusCode == 200 && body != null && body.value != null)
                                {
                                    getURI(body, function (result)
                                    {
                                        var valid_result = [];
                                        result.forEach(function (element, index) {
                                            if (element != null)
                                            {
                                                valid_result.push(element);
                                            }
                                        })
                                        msg.payload = valid_result;
                                        msg.detail = body;                                    
                                        node.send(msg);
                                    });
                                }
                                else
                                {
                                    node.error(body);
                                }
                            }
                            else
                            {
                                node.error(error);
                            }          
                        }
                        catch (e)
                        {
                            node.error(e, msg);
                        }
                    });
                }
                else if (config.operation == "trendingtopics") // Trending Topics
                {
                    var options = {
                        url: 'https://api.cognitive.microsoft.com/bing/v5.0/news/trendingtopics',
                        method: 'GET',
                        headers: {
                            'Ocp-Apim-Subscription-Key': this.credentials.key
                        }
                    };

                    //console.log("options=" + JSON.stringify(options));   
                    request(options, function (error, response, body)
                    {
                        try
                        {
                            if (!error)
                            {
                                try { body = JSON.parse(body); } catch (e) {}
                                console.log("response.statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                                if (response.statusCode == 200 && body != null && body.value != null)
                                {
                                    msg.payload = body.value;
                                    msg.detail = body;                                    
                                    node.send(msg);
                                }
                                else
                                {
                                    node.error(body);
                                }
                            }
                            else
                            {
                                node.error(error);
                            }          
                        }
                        catch (e)
                        {
                            node.error(e, msg);
                        }
                    });
                }
                else
                {
                    node.error("Unsupported operation: " + config.operation);
                }
            }
        });
    }

    RED.nodes.registerType("Bing News Search", newssearch,
    {
        credentials: {
            key: {
                type: "password"
            }
        }
    });                       
}