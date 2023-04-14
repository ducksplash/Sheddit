        var title_maxchars = 100;
        var body_maxchars = 1000;
        var link_maxchars = 200;
        var file_maxbytes = 200000;
        var file_b64_body = '';
        var title_ready = false;
        var post_ready = false;
        var initialised = false;

        if (!initialised)
        {
            load_topics();
        }
        
        $(document).ready(function()
        {

            $("#send_button").click(function()
            {
                // onSend set status to 'sending'

                $("#resso").text("sending...");
                
                var post_type = $("#post_type").val();

                var title_string = $("#title_input").val();
                var body_string = $(".body_input").val();
                var link_string = $(".link_input").val();
                var topic_id = $("#post_topic").val();

                if (post_type == 2)
                {
                    var base64String = file_b64_body ? file_b64_body : '';
                }
                else
                {
                    var base64String = '';
                }

                
                $.ajax({
                type: "POST",
                url: "./backwash.php",
                data: {
                    post_type: post_type,
                    post_title: title_string,
                    post_topic: topic_id,
                    post_body: body_string,
                    post_link: link_string,
                    file_body: base64String,
                },
                dataType: "json",
                success: function(response)
                {

                    console.log(response);
                    if(response.status == 200)
                    {
                        $("#resso").text(makeValidString(response));
                    }
                        else 
                    {
                        $("#resso").text(makeValidString(response));
                    }

                    reset_form();
                    load_topics();

                
                },
                error: function(xhr, status, error)
                {
                    $("#resso").text(error);
                    reset_form();
                }
                });

            });
        });


            
        $("select[name='post_type']").change(function() 
            {
                select_post_type();
            });
            
            
            function select_post_type() 
            {
                var selectedValue = $("#post_type").val();

                var textOnlyBox = "<label for=\"body_input\">Body</label><br/>"+
                "<textarea id=\"body_input\" class=\"postinputtextarea body_input\" placeholder=\"some text\"></textarea><br/>"+
                "<span class=\"charsleft charsleft_body\">1000</span>";

                var linkOnlyBox = "<label for=\"link_input\">URL</label><br/>"+
                "<input type=\"text\" id=\"link_input\" class=\"postinput link_input\" placeholder=\"some text\"/><br/>"+
                "<span class=\"charsleft charsleft_url\">200</span>";

                var fileUploadBox = "<label for=\"file_input\">Image File</label><br/>"+
                "<input type=\"file\" name=\"file_input\" class=\"postinput file_input\" id=\"file_input\"/><br/>"+
                "<span class=\"charsleft\">Max Filesize 5MB</span>";
                
                var targetSpan = $("#post_window");

                // Empty the post_window
                targetSpan.empty();

                switch (selectedValue) {
                    case "1":
                    targetSpan.append(linkOnlyBox);
                    break;
                    case "2":
                    targetSpan.append(fileUploadBox);
                    break;
                    default:
                    targetSpan.append(textOnlyBox);
                    break;
                }

                console.log(selectedValue);
            }

            





        // validate strings
        function makeValidString(dirtyString) 
        {
            // Remove any leading/trailing whitespace
            let cleanString = $.trim(dirtyString);

            // Escape any HTML tags
            cleanString = $('<div>').text(cleanString).html();

            // Escape any backticks, double quotes, and slashes
            cleanString = cleanString.replace(/[`"\\]/g, '\$&');

            // Replace any apostrophes with a single quote to prevent SQL injection
            cleanString = cleanString.replace(/'/g, "\'");

            // Decode any HTML special characters
            cleanString = $('<div>').html(cleanString).text();

            return cleanString;
        }

        
        // check title
        $("#title_input").on("input", function() 
        {
            
        var title = $(this).val();

        var title_length = title.length;

        if (title_length >= title_maxchars)
        {
            var curtailed_value = title.substring(0, title.length - 1);
            $("#title_input").val(curtailed_value);
            title_length = title.length;
        }
        
        $(".charsleft_title").text(title_maxchars - title.length);

        if (title.length > 0 && title.length <= title_maxchars)
        {
            title_ready = true;
        }
        else
        {
            title_ready = false;
        }
        check_can_post();

        
        });

        // check post body
        $(document).on("input", ".body_input", function() 
        {
            console.log("input");
            var body = $(this).val();

            var body_length = body.length;

            if (body_length >= body_maxchars) {
                var curtailed_value = body.substring(0, body.length - 1);
                $(".body_input").val(curtailed_value);
                body_length = body.length;
            }
                
            $(".charsleft_body").text(body_maxchars - body.length);


            if (body.length > 0 && body.length <= body_maxchars)
            {
                post_ready = true;
            }
            else
            {
                post_ready = false;
            }
            check_can_post();

        });

        // check link body
        $(document).on("input", ".link_input", function() 
        {
            console.log("input");
            var link = $(this).val();

            var pattern = new RegExp('((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

            if (pattern.test(link)) 
            {
                $("#resso").text("Valid URL");
                post_ready = true;

            } 
            else 
            {
                $("#resso").text("Invalid URL");                    
                post_ready = false;

            }

            var link_length = link.length;

            if (link_length >= link_maxchars) {
                var curtailed_value = link.substring(0, link.length - 1);
                $(".link_input").val(curtailed_value);
                link_length = link.length;
            }
                
            $(".charsleft_url").text(link_maxchars - link.length);

            check_can_post();

        });


        // upload file

        $(document).on("input", ".file_input", function() 
        {
            // initialise and empty local storage

            localStorage.setItem('base64file','')
            // Get the file input element
            var fileInput = $(".file_input").get(0);

            $("#resso").text("Preparing image");


            // Get the selected file
            var file = fileInput.files[0];
        
            if (file.type.match(/image.*/)) 
            {

                // Check if the file is smaller than 1MB
                if (file.size <= 5000000) 
                {
                // Create a new FileReader object
                var reader = new FileReader();
                
                // Set up the reader to read the file as a data URL
                reader.readAsDataURL(file);
                
                // When the reader has finished reading the file
                    reader.onload = function() 
                    {
                        // Get the base64-encoded string
                        var base64String = reader.result.split(',')[1];
                        
                        file_b64_body = base64String;
                        $("#resso").text("Image ready to save");
                        post_ready = true;
                        check_can_post();
                
                    }
                }
                // If the file is larger than 5MB, display an error message
                else 
                {
                    $("#resso").text("File size exceeds 5MB limit");
                    $(".file_input").val('');
                    
                    file_b64_body = '';                        
                    post_ready = false;
                    check_can_post();

                }
            }
            else 
            {
                $("#resso").text("Only image files are supported");
                $(".file_input").val('');
                
                file_b64_body = '';
                post_ready = false;
                check_can_post();

            }
        });


        function reset_form()
        {
            $("#post_type").val(0);
            $("#title_input").val('');
            $(".body_input").val('');
            $(".link_input").val('');
            $(".file_input").val('');
            select_post_type();
            $(".charsleft_title").text(title_maxchars);
            $(".charsleft_body").text(body_maxchars);
            post_ready = false;
            check_can_post();
        }

        function check_can_post()
        {

            if (title_ready && post_ready)
            {
                $("#send_button").prop("disabled", false);
            }
            else
            {
                $("#send_button").prop("disabled", true);
            }


        }

        $(document).on("click", ".loadtopics", function() 
        {
            console.log('load topics click');
            load_topics();
        });

        
        function load_topics()
        {
            console.log('load topics');


            // set visible windows 
            // this is the 'topics' function so we want topics visible and thread/posts hidden

            $('.postwindow').css('display', 'none');
            $('.threadwindow').css('display', 'none');
            $('.topicwindow').css('display', 'none');
            $('.loadingscreen').css('display', 'block');

            // empty the demo content out of the topic window

            $('.topicwindow').empty();


            $('.topicpathtext').empty();

            $('.topicpathtext').append("/front page/&nbsp;&nbsp;&nbsp;&nbsp;");

            $('.topictitle').text("Home");

            // set 

            // let's find the topics 
            $.ajax({
                type: "GET",
                url: "./getbeefs.php",
                data: {
                    get_type: 'topic'
                },
                success: function(response) 
                {
                    $('.topicwindow').css('display', 'block');
                    $('.loadingscreen').css('display', 'none');
                    
                    console.log(response.length);

                    for (var i = 0; i < response.length; i++)
                    {
                        var topicID = response[i]['id'];
                        var topicname = response[i]['title'];
                        var topicdescription = response[i]['description'];
                        var topicpostcount = response[i]['posts'];
                        var topicreplycount = response[i]['replies'];
                        var lastpostdate = response[i]['lastpost'];

                        
                        $("#post_topic").append("<option value='"+topicID+"'>"+topicname+"</option>");
                        
                        $('.topicwindow').append('<div class="topicpackage" id="topicpackage_0">\n\
                        <div class="topiccontainer">\n\
                            <div class="topicdetails">\n\
                            <div class="topiclinktitle" id="topic_name_'+topicID+'">\n\
                            <button class="topicbutton loadposts" id="'+topicID+'" name="'+topicname+'">'+topicname+'</button></div>\n\
                            <div class="topicdescription" id="topic_description_'+topicID+'">'+topicdescription+'</div>\n\
                            </div>\n\
                            <div class="topicstatstitles">\n\
                                Threads: <span id="thread_count_'+topicID+'" class="topicstats">'+topicpostcount+'</span><br/>\n\
                                Replies: <span id="thread_count_'+topicID+'" class="topicstats">'+topicreplycount+'</span><br/>\n\
                                Last Post: <span id="thread_count_'+topicID+'" class="topicstats">'+lastpostdate+'</span>\n\
                            </div>\n\
                        </div>\n\
                    </div>');
                    }    
                }
            });
        }


        $(document).on("click", ".loadposts", function() 
        {

            console.log('load posts in given topic');

            // set visible windows 
            // this is the 'posts' function so we want posts visible and thread/topics hidden

            $('.postwindow').css('display', 'none');
            $('.threadwindow').css('display', 'none');
            $('.topicwindow').css('display', 'none');
            $('.loadingscreen').css('display', 'block');

            // empty the demo content out of the topic window
            //

            $('.postwindow').empty();

            // get topic id and topic name
            // getting topic name here seems shonky
            // must try something else
            var topicID = this.id;

            // let's find the posts 
            $.ajax({
                type: "GET",
                url: "./getbeefs.php",
                data: {
                    get_type: 'post',
                    topic_id: topicID
                },
                success: function(response) 
                {
                    $('.loadingscreen').css('display', 'none');
                    $('.postwindow').css('display', 'block');

                    console.log(response);

                    for (var i = 0; i < response.length; i++)
                    {

                        if (i == 0)
                        {
                            
                            var topicname = response[i]['topic'];
                            var titletopicname = (topicname.length > 40) ? topicname.substring(0, 40) + '...' : topicname;
                            var pathtopicname = (topicname.length > 20) ? topicname.substring(0, 20) + '...' : topicname; 
                            
                            $('.topicpathtext').empty();
        
                            $('.topicpathtext').append("/<a href=\"#\" class=\"go_home loadtopics\" title=\"Front Page\">front page</a>/"+pathtopicname+"/&nbsp;&nbsp;&nbsp;&nbsp;");
                
                            // set topic name in title bar
                            $('.topictitle').text(titletopicname);
                        }


                        var postID = response[i]['id'];
                        var posttitle = response[i]['title'];
                        var postbody = response[i]['body'];
                        var posttype = response[i]['item_type'];
                        var postreplies = response[i]['replies'];
                        var postrep = response[i]['reputation'];

                        var postinsert = '';
                        var linkpost = "<div class='postlinkpreview'></div>";
                        var imgpost = "<div class='postimgpreview'><img class='previewimg loadcomments' id='"+postID+"' src='data:image/png;base64,"+postbody+"' alt='"+posttitle+"' /></div>";
                        var textpost = "<div class='posttextpreview'>"+postbody+"</div>";
    
                        
    
                        switch (posttype) 
                        {
                            case "1":
                            postinsert = linkpost;
                            break;
                            case "2":
                            postinsert = imgpost;
                            break;
                            default:
                            postinsert = textpost;
                            break;
                        }

                        console.log(postID);
                        console.log(posttitle);
                        console.log(postbody);
                        console.log(postreplies);

                        $('.postwindow').append('<div class="postpackage" id="postpackage_'+postID+'">\n\
                            <div class="postslab">\n\
                                <div id="reppanelpost" class="displayreppost">\n\
                                    <button class="arrow up" title="Add Rep"> </button><br/>\n\
                                    <span id="doot" class="repreadingpost">'+postrep+'</span><br/>\n\
                                    <button class="arrow down" title="Reduce Rep"> </button>\n\
                                </div>\n\
                                <div class="postslabinner">\n\
                                <div class="postlinktitle" id="'+topicID+'"><button class="topicbutton loadcomments" id="'+postID+'" name="'+topicname+'">'+posttitle+'</button></div>\n\
                                <div>'+postinsert+'</div>\n\
                                </div>\n\
                            </div>\n\
                        </div>');
                
                    }    
                }
            });

            console.log(this.id);

        });







        $(document).on("click", ".loadcomments", function() 
        {

            console.log('load posts in given topic');

            // set visible windows 
            // this is the 'threads' function so we want threads visible and topics/posts hidden

            $('.postwindow').css('display', 'none');
            $('.threadwindow').css('display', 'none');
            $('.topicwindow').css('display', 'none');
            $('.loadingscreen').css('display', 'block');

            // empty the demo content out of the topic window
            //

            $('.threadwindow').empty();

            // get topic id and topic name
            // getting topic name here seems shonky
            // must try something else
            var postID = this.id;
            var parenttopicname = this.name;
            var parenttopicID = this.parentElement.id;

            console.log(parenttopicname); // ok
            console.log(parenttopicID); // ok

            

            // let's find the comments 
            $.ajax({
                type: "GET",
                url: "./getbeefs.php",
                data: {
                    get_type: 'thread',
                    post_id: postID
                },
                success: function(response) 
                {

                    $('.loadingscreen').css('display', 'none');
                    $('.threadwindow').css('display', 'block');

                    // get main comment first

                    var parentowner = response['threadowner'];
                    var parentID = response['id'];
                    var parenttitle = response['threadtitle'];
                    var parentbody = response['threadbody'];
                    var parenttype = response['threadtype'];
                    var parentreputation = response['reputation'];
                    var parentcreated = response['date_created'];
                    var parentmodified = response['date_modified'];

                    console.log(parenttitle);
                    console.log(parentbody);
                    console.log(parenttype);
                    console.log(parentreputation);
                    console.log(parentcreated);
                    console.log(parentmodified);

                    var postinsert = '';
                    var linkpost = "<a href='"+parentbody+"'>"+parentbody+"</a>";
                    var imgpost = "<a href='data:image/png;base64,"+parentbody+"'><img class='postimg' src='data:image/png;base64,"+parentbody+"' alt='"+parenttitle+"' /></a>";
                    var textpost = "<pre>"+parentbody+"</pre>";

                    

                    switch (parenttype) 
                    {
                        case "1":
                        postinsert = linkpost;
                        break;
                        case "2":
                        postinsert = imgpost;
                        break;
                        default:
                        postinsert = textpost;
                        break;
                    }
                    

                    // output parent thread panel

                    $('.threadwindow').append('<div class=\"displaypost\" id=\"always_zero\">\n\
                    <div id=\"reppanel\" class=\"displayrep\">\n\
                    <button class=\"arrow up\" title=\"Add Rep\"> </button><br/>\n\
                    <span id=\"doot\" class=\"repreading\">'+parentreputation+'</span><br/>\n\
                    <button class=\"arrow down\" title=\"Reduce Rep\"> </button><br/>\n\
                    </div>\n\
                    <div class=\"displaypostroot\">\n\
                    <div class=\"posttitle\">'+parenttitle+'</div>\n\
                    By <button class=\"profile_button\">'+parentowner+'</button><br/>\n\
                    '+postinsert+'\n\
                    <br/><sup>'+parentcreated+'</sup><br/>\n\
                    <button class=\"replybutton normalreply\" title=\"Reply\" name=\"'+parentID+'\">Reply</button>\n\
                    <button class=\"replybutton quotereply\" title=\"Reply With Quote\" name=\"'+parentID+'\">Quote</button>\n\
                    <button title=\"Delete\" class=\"deletebutton deletethread\" id=\"'+parentID+'\">Delete</button>\n\
                    </div>\n\
                    </div>');    

                    
                    var titletopicname = (parenttitle.length > 40) ? parenttitle.substring(0, 40) + '...' : parenttitle;
                    var pathtoparenttopicname = (parenttopicname.length > 20) ? parenttopicname.substring(0, 20) + '...' : parenttopicname; 
                    var pathtopicname = (parenttitle.length > 20) ? parenttitle.substring(0, 20) + '...' : parenttitle; 
                    
                    $('.topicpathtext').empty();

                    $('.topicpathtext').append('/<a href="#" class="go_home loadtopics" title="Front Page">front page</a>/<a href="#" class="go_home loadposts" id="'+parenttopicID+'" title="'+pathtoparenttopicname+'">'+pathtoparenttopicname+'</a>/'+pathtopicname+'&nbsp;&nbsp;&nbsp;&nbsp;');
        
                    // set topic name in title bar
                    $('.topictitle').text(titletopicname);


                    // ok lets get the replies


                    for (var i = 0; i < response['replies'].length; i++)
                    {

                        // console.log(response['replies'][i]);
                    
                        var replyID = response['replies'][i]['id'];
                        var replytitle = response['replies'][i]['title'];
                        var replyowner = response['replies'][i]['ownerID'];
                        var replybody = response['replies'][i]['body'];
                        var replytype = response['replies'][i]['item_type'];
                        var replyreputation = response['replies'][i]['reputation'];
                        var replydatecreated = response['replies'][i]['date_created'];
                        var replydatemodified = response['replies'][i]['date_modified'];
                        


                        $('.threadwindow').append('<div class="displayreply" id="incrementally_specified">\n\
                        <div id="reppanel" class="displayrep">\n\
                        <button class="arrow up" title="Add Rep" id="'+replyID+'"> </button><br/>\n\
                        <span id="doot" class="repreading">'+replyreputation+'</span><br/>\n\
                        <button class="arrow down" title="Reduce Rep" id="'+replyID+'"> </button><br/>\n\
                        </div>\n\
                        <div class="displaypostroot">\n\
                        <span class="posttitle">RE: '+replytitle+'</span><br/>\n\
                        By <button class="profile_button">'+replyowner+'</button><br/>\n\
                        <pre>'+replybody+'</pre>\n\
                        <sup>'+replydatecreated+'</sup><br/>\n\
                        <button class="replybutton normalreply" title="Reply" id="'+replyID+'">Reply</button>\n\
                        <button class="replybutton quotereply" title="Reply With Quote" id="'+replyID+'">Quote</button>\n\
                        <button title="Delete" class="deletebutton deletereply" id="'+replyID+'">Delete</button>\n\
                        </div></div>');  
                    }

                }
            });

        });





        // do onloads
        
        //load_topics();