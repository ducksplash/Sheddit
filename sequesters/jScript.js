        
        var title_maxchars = 100;
        var body_maxchars = 1000;
        var reply_maxchars = 1000;
        var link_maxchars = 200;
        var file_maxbytes = 200000;
        var file_b64_body = '';
        var title_ready = false;
        var post_ready = false;
        var initialised = false;

        var username_ready = false;
        var password_ready = false;
        var password_again_ready = false;
        var email_ready = false;
        
        

        if (!initialised)
        {
            $.ajax({
                type: "GET",
                url: "./innitdoe.php", 
                xhrFields: {
                    withCredentials: true
                },
                success: function(response) 
                {
                    $(".sitetitle").text(response);
                    $("#sitetitle").text(response);        
                }
            });

            // check for logged in users

            
            $.ajax({
                type: "POST",
                url: "./memberlings.php", 
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    operation: "guicheck",
                },
                success: function(response) 
                {
                    if (response != "false")
                    {
                        var resource = JSON.parse(response);
                        var membertype = '';

                        if (resource['userlevel'] == -1)
                        {
                            membertype = '<br/>(<span class="bannedcolour">Banned</span>)';
                        }
                        else if (resource['userlevel'] == 1)
                        {
                            membertype = '<br/>(<span class="modcolour">Moderator</span>)';
                        }
                        else if (resource['userlevel'] == 2)
                        {
                            membertype = '<br/>(<span class="admincolour">Admin</span>)';
                        }
                        else
                        {
                            membertype = '<br/>(<span class="usercolour">Member</span>)';
                        }

                        // switch out panel
                        $("#account").empty();
                        $("#account").append('<div style="text-align: center;">Logged in as<br/>'+resource['username']+membertype+'<br/><br/>\n\
                        <button id="logout_button" class="logoutbutton dologout">Log Out</button>\n\
                        </div>');


                    }
                }
            });

            initialised = true;
        }

                
        
        // Get the URL path
        var path = window.location.pathname;
        // Split the path into an array of segments using the slash (/) as a delimiter
        var segments = path.split('/');
        // Get the topic and thread parameters from the segments array
        var get_topic = segments[1];
        var get_thread = segments[2];

        if (get_topic > 0 && get_thread > 0)
        {
            console.log('<for seo urls> get thread:'+get_thread);
            
            load_topics();
            setTimeout(function() 
            {
              loadthreads(this, get_thread, get_topic, 'thread');
            }, 500);
            
        }
        else if (get_topic > 0)
        {
            console.log('<for seo urls> get topic:'+get_topic);  
            
            // take user straight to topic
            load_topics();
            

            setTimeout(function() {
                loadposts(this, get_topic);
              }, 500);
        }
        else
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
                xhrFields: {
                    withCredentials: true
                },
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


        // check post body
        $(document).on("input", ".reply_input", function() 
        {
            var reply = $(this).val();

            var reply_length = reply.length;

            if (reply_length >= reply_maxchars) 
            {
                var curtailed_value = reply.substring(0, reply.length - 1);
                $(".reply_input").val(curtailed_value);
                reply_length = reply.length;
            }
                
            $(".charsleft_reply").text(reply_maxchars - reply.length);


            if (reply.length > 0 && reply.length <= reply_maxchars)
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
                if (file.size <= 6000000) 
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
            $(".charsleft_reply").text(title_maxchars);
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
            load_topics();
        });

        
        function load_topics()
        {

            console.log('load topics 463');

            // set visible windows 
            // this is the 'topics' function so we want topics visible and thread/posts hidden

            $('.postwindow').css('display', 'none');
            $('.threadwindow').css('display', 'none');
            $('.topicwindow').css('display', 'none');
            $('.loadingscreen').css('display', 'block');
            $('.loadingscreen').html('Fetching Content<br/>Please Wait');

            // empty the demo content out of the topic window

            $('.topicwindow').empty();


            $('.topicpathtext').empty();

            $('.topicpathtext').append("/front page/&nbsp;&nbsp;&nbsp;&nbsp;");

            // set title in header strip
            $('.topictitle').text("Home");

            // empty topic list
            $('.post_topic').empty();

            // get sort order
            var sort_by = $('.sort_by').val();

            // get limit
            $('.post_topic').empty();

            // let's find the topics 
            $.ajax({
                type: "GET",
                url: "./getbeefs.php", 
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    get_type: 'topic',
                    sortingorder: sort_by
                },
                success: function(response) 
                {
                    $('.topicwindow').css('display', 'block');
                    $('.loadingscreen').css('display', 'none');
                    

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
            loadposts(this, 0);
        });

        function loadposts(thing, externalID)
        {
            console.log('load posts');
            // set visible windows 
            // this is the 'posts' function so we want posts visible and thread/topics hidden

            $('.postwindow').css('display', 'none');
            $('.threadwindow').css('display', 'none');
            $('.topicwindow').css('display', 'none');
            $('.loadingscreen').css('display', 'block');
            $('.loadingscreen').html('Fetching Content<br/>Please Wait');

            // empty the demo content out of the topic window
            //
            $('.postwindow').empty();


            // get topic id and topic name
            // getting topic name here seems shonky
            // must try something else
            if (externalID == 0)
            {
                var topicID = thing.id;
            }
            else
            {
                var topicID = externalID;    
            }


            var sort_by = $('.sort_by').val();

            // let's find the posts 
            $.ajax({
                type: "GET",
                url: "./getbeefs.php", 
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    get_type: 'post',
                    topic_id: topicID,
                    sortingorder: sort_by
                },
                success: function(response) 
                {
                    $('.loadingscreen').css('display', 'none');
                    $('.postwindow').css('display', 'block');

                    if (response.length == 0)
                    {
                        // $('.loadingscreen').css('display', 'block');
                        // $('.loadingscreen').text('No posts here.');
                        load_topics();
                    }
                    $('.topicpathtext').empty();

                    $('.topicpathtext').append('/<button class="go_home loadtopics" title="Front Page"">front page</button>/&nbsp;&nbsp;&nbsp;&nbsp;');


                    for (var i = 0; i < response.length; i++)
                    {

                        if (i == 0)
                        {
                            
                            var topicname = response[i]['topic'];
                            var pathtopicname = (topicname.length > 20) ? topicname.substring(0, 20) + '...' : topicname; 
                            
                            $('.topicpathtext').empty();
        
                            $('.topicpathtext').append('/<button class="go_home loadtopics" title="Front Page" name="'+topicname+'">front page</button>/'+pathtopicname+'/&nbsp;&nbsp;&nbsp;&nbsp;');
                
                            // set topic name in title bar
                            $('.topictitle').text(topicname);
                        }


                        var postID = response[i]['id'];
                        var posttitle = response[i]['title'];
                        var postusername = response[i]['username'];
                        var postuserlevel = response[i]['userlevel'];
                        var postbody = response[i]['body'];
                        var posttype = parseInt(response[i]['item_type']);
                        var postreplies = response[i]['replies'];
                        var postrep = response[i]['reputation'];


                        var membername = '';
                        if (postuserlevel == -1)
                        {
                            membername = '<span class="bannedcolour">'+postusername+'</span>';
                        }
                        else if (postuserlevel == 1)
                        {
                            membername = '<span class="modcolour">'+postusername+'</span>';
                        }
                        else if (postuserlevel == 2)
                        {
                            membername = '<span class="admincolour">'+postusername+'</span>';
                        }
                        else
                        {
                            membername = '<span class="usercolour">'+postusername+'</span>';
                        }
                        
                        
                        var postinsert = '';
                        var linkpost = "<div class='postlinkpreview'>No Preview Available</div>";
                        var imgpost = "<div class='postimgpreview' id="+topicID+"'><img class='previewimg loadcomments' id='"+postID+"' src='./img.php?imid="+postID+"' name='"+topicname+"' alt='"+posttitle+"' /></div>";
                        var textpost = "<div class='posttextpreview'>"+postbody+"</div>";
    
                        
    
                        switch (posttype) 
                        {
                            case 1:
                            postinsert = linkpost;
                            break;
                            case 2:
                            postinsert = imgpost;
                            break;
                            default:
                            postinsert = textpost;
                            break;
                        }


                        $('.postwindow').append('<div class="postpackage" id="postpackage_'+postID+'">\n\
                            <div class="postslab">\n\
                                <div id="reppanelpost" class="displayreppost">\n\
                                    <button class="arrow up repup" title="Add Rep" id="'+postID+'"> </button><br/>\n\
                                    <span id="doot" class="repreadingpost doot_'+postID+'">'+postrep+'</span><br/>\n\
                                    <button class="arrow down repdown" title="Reduce Rep" id="'+postID+'"> </button>\n\
                                </div>\n\
                                <div class="postslabinner">\n\
                                <div class="postlinktitle" id="'+topicID+'"><button class="topicbutton loadcomments" id="'+postID+'" name="'+topicname+'">'+posttitle+'</button>\n\
                                <br/><sub>by '+membername+'</sub></div>\n\
                                <div>'+postinsert+'</div>\n\
                                </div>\n\
                            </div>\n\
                        </div>');
                
                    }    
                }
            });

        }


        $(document).on("click", ".loadcomments", function() 
        {

            loadthreads(this, 0);

        });

        function loadthreads(thingy, pid, tid, tname, externalID)
        {
            // set visible windows 
            // this is the 'threads' function so we want threads visible and topics/posts hidden

            $('.postwindow').css('display', 'none');
            $('.threadwindow').css('display', 'none');
            $('.topicwindow').css('display', 'none');
            $('.loadingscreen').css('display', 'block');
            $('.loadingscreen').html('Fetching Content<br/>Please Wait');

            // empty the demo content out of the topic window
            //

            $('.threadwindow').empty();

            // get topic id and topic name
            // getting topic name here seems shonky
            // must try something else
            if (!pid && !tid)
            {
                var postID = thingy.id;
                var parenttopicname = thingy.name;
                var parenttopicID = thingy.parentElement.id;
            }
            else
            {
                var postID = pid;
                var parenttopicname = tname;
                var parenttopicID = tid;
            }

            // let's find the comments 
            $.ajax({
                type: "GET",
                url: "./getbeefs.php", 
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    get_type: 'thread',
                    post_id: postID
                },
                success: function(response) 
                {

                    $('.loadingscreen').css('display', 'none');
                    $('.threadwindow').css('display', 'block');


                    // get main comment first

                    var parentowner = response['threadusername'];
                    var parentownerID = response['ownerID'];
                    var parentID = response['id'];
                    var parenttitle = response['threadtitle'];
                    var parentbody = response['threadbody'];
                    var parenttype = parseInt(response['threadtype']);
                    var parentreputation = response['reputation'];
                    var parentcreated = response['date_created'];
                    var parentmodified = response['date_modified'];
                    var userlevel = response['userlevel'];

                    if (!parentID)
                    {
                        loadposts(this, parenttopicID);
                    }
                    
                        
                    var membername = '';
                    if (userlevel == -1)
                    {
                        membername = '<span style="color: #CC0000;">'+parentowner+'</span>';
                    }
                    else if (userlevel == 1)
                    {
                        membername = '<span style="color: #00CC00;">'+parentowner+'</span>';
                    }
                    else if (userlevel == 2)
                    {
                        membername = '<span style="color: #0000CC;">'+parentowner+'</span>';
                    }
                    else
                    {
                        membername = '<span style="color: #404040;">'+parentowner+'</span>';
                    }
                    
                    

                    var postinsert = '';
                    var linkpost = "<a title='WARNING: External links may contain malicious content.' class='outlink' href='"+parentbody+"' target='_BLANK'>"+parentbody+"</a>";
                    var imgpost = "<a href='./img.php?imid="+parentID+"' target='_BLANK'><img class='postimg' src='./img.php?imid="+parentID+"' alt='"+parenttitle+"' /></a>";
                    var textpost = makeValidString(parentbody);

                    
                    

                    switch (parenttype) 
                    {
                        case 1:
                        postinsert = linkpost;
                        break;
                        case 2:
                        postinsert = imgpost;
                        break;
                        default:
                        postinsert = textpost;
                        break;
                    }
                    

                    // output parent thread panel

                    $('.threadwindow').append('<div class="displaypost" id="always_zero">\n\
                    <div id="reppanel" class="displayrep">\n\
                    <button class="arrow up repup" title="Add Rep" id="'+parentID+'"> </button><br/>\n\
                    <span id="doot" class="repreading doot_'+parentID+'">'+parentreputation+'</span><br/>\n\
                    <button class="arrow down repdown" title="Reduce Rep" id="'+parentID+'"> </button><br/>\n\
                    </div>\n\
                    <div class="displaypostroot">\n\
                    <div class="posttitle">'+parenttitle+'</div>\n\
                    By <button class="profile_button" id="'+parentownerID+'">'+membername+'</button><br/>\n\
                    <br/>'+postinsert+'<br/>\n\
                    <br/><sup>'+parentcreated+'</sup><br/>\n\
                    <button class="replybutton normalreply" title="Reply" id="'+parentID+'" name="'+parenttopicID+'">Reply</button>\n\
                    <button class="replybutton quotereply" title="Reply With Quote" name="'+parentID+'">Quote</button>\n\
                    <button title="Delete" class="deletebutton deleteitem" id="'+parentID+'">Delete</button>\n\
                    </div>\n\
                    </div>');    

                    
                    var titletopicname = (parenttitle.length > 40) ? parenttitle.substring(0, 40) + '...' : parenttitle;
                    var pathtoparenttopicname = (parenttopicname.length > 20) ? parenttopicname.substring(0, 20) + '...' : parenttopicname; 
                    var pathtopicname = (parenttitle.length > 20) ? parenttitle.substring(0, 20) + '...' : parenttitle; 
                    
                    $('.topicpathtext').empty();

                    $('.topicpathtext').append('/<button class="go_home loadtopics" title="Front Page">front page</button>/<button class="go_home loadposts loadpostsbutton" id="'+parenttopicID+'" title="'+parenttopicname+'">'+pathtoparenttopicname+'</button>/'+pathtopicname+'&nbsp;&nbsp;&nbsp;&nbsp;');
        

                    // ok lets get the replies


                    for (var i = 0; i < response['replies'].length; i++)
                    {

                    
                        var replyID = response['replies'][i]['id'];
                        var replytitle = response['replies'][i]['title'];
                        var replyowner = response['replies'][i]['ownerID'];
                        var replyusername = response['replies'][i]['username'];
                        var replybody = response['replies'][i]['body'];
                        var replytype = response['replies'][i]['item_type'];
                        var replyreputation = response['replies'][i]['reputation'];
                        var replydatecreated = response['replies'][i]['date_created'];
                        var replydatemodified = response['replies'][i]['date_modified'];
                        
                        var userlevel = response['replies'][i]['userlevel'];

                    
                        
                        var membername = '';
                        if (userlevel == -1)
                        {
                            membername = '<span style="color: #CC0000;">'+replyusername+'</span>';
                        }
                        else if (userlevel == 1)
                        {
                            membername = '<span style="color: #00CC00;">'+replyusername+'</span>';
                        }
                        else if (userlevel == 2)
                        {
                            membername = '<span style="color: #0000CC;">'+replyusername+'</span>';
                        }
                        else
                        {
                            membername = '<span style="color: #404040;">'+replyusername+'</span>';
                        }
                        

                        $('.threadwindow').append('<div class="displayreply" id="incrementally_specified">\n\
                        <div id="reppanel" class="displayrep">\n\
                        <button class="arrow up repup" title="Add Rep" id="'+replyID+'"> </button><br/>\n\
                        <span id="doot" class="repreading doot_'+replyID+'">'+replyreputation+'</span><br/>\n\
                        <button class="arrow down repdown" title="Reduce Rep" id="'+replyID+'"> </button><br/>\n\
                        </div>\n\
                        <div class="displaypostroot">\n\
                        <span class="posttitle">RE: '+replytitle+'</span><br/>\n\
                        By <button class="profile_button" id="'+replyowner+'">'+membername+'</button><br/>\n\
                        <br/>'+replybody+'<br/><br/>\n\
                        <sup>'+replydatecreated+'</sup><br/>\n\
                        <button class="replybutton normalreply" title="Reply" id="'+parentID+'" name="'+parenttopicID+'">Reply</button>\n\
                        <button class="replybutton quotereply" title="Reply With Quote" name="'+parentID+'">Quote</button>\n\
                        <button title="Delete" class="deletebutton deleteitem" id="'+replyID+'">Delete</button>\n\
                        </div></div>');  
                    }

                }
            });

        }


        $(document).on("click", ".normalreply", function() 
        {
            // Create a modal
            var modal = $("<div>").addClass("replymodal");
            
            // Create a cancel button
            var cancelButton = $("<button>").text("Cancel").addClass("modalbutton").on("click", function() {
                // Close the modal when the OK button is clicked
                modal.remove();
                $(".overlay").remove();
            });

            var topicName = $('.topictitle').text();
            var topicID = this.name;
            var threadID = this.id;

            // Create a submit button
            var submitButton = $("<button>").text("Add Reply").addClass("modalbutton").on("click", function() {
                // Close the modal when the OK button is clicked


                var replystring = $('.reply_input').val();

                $.ajax({
                    type: "POST",
                    url: "./backwash.php", 
                    xhrFields: {
                        withCredentials: true
                    },
                    data: {
                        post_topic: topicID,
                        post_body: replystring,
                        post_ID: threadID
                    },
                    dataType: "json",
                    success: function(response)
                    {
    
                        reset_form();
                        loadthreads(this,threadID,topicID,topicName);
    
                    
                    },
                    error: function(xhr, status, error)
                    {
                        reset_form();
                    }
                    });


                modal.remove();
                $(".overlay").remove();
            });
            


            // Add things
            modal.append('<div style="text-align: left; padding-left: 2vw; margin-bottom: 6px;"><br/>\n\
            <label for="body_reply" style="text-align: left;">Add Reply</label></div>\n\
            <textarea id="reply_input" class="replytextarea reply_input" placeholder="some text"></textarea><br/>\n\
            <span class="charsleft charsleft_reply" style="float: right; padding: 0.8vw;">1000</span>');
            
            
            modal.append(cancelButton);
            modal.append(submitButton);
            
            
            // Add an overlay to the website
            var overlay = $("<div>").addClass("overlay").addClass("modaloverlay");
            
            // Add the modal and overlay to the website
            $("body").append(overlay).append(modal);
            });
          
          

            $(document).on("click", ".repup", function() 
            {

                var postID = this.id;

                $.ajax({
                    type: "GET",
                    url: "./reps.php", 
                    xhrFields: {
                        withCredentials: true
                    },
                    data: {
                        item_id: postID,
                        rep_value: 'up',
                    },
                    success: function(response) 
                    {
                        $(".doot_"+postID).text(response);
                    }
                });

            });

            $(document).on("click", ".repdown", function() 
            {
                var postID = this.id;
                
                $.ajax({
                    type: "GET",
                    url: "./reps.php", 
                    xhrFields: {
                        withCredentials: true
                    },
                    data: {
                        item_id: postID,
                        rep_value: 'down',
                    },
                    success: function(response) 
                    {
                        $(".doot_"+postID).text(response);
                    }
                });
            });

           
            

    // check username
    $(document).on("input", ".usernamereg", function() 
    {
        var usernameslug = $(this).val();

        // check if username contains invalid characters
        if (!/^[a-zA-Z0-9_]{6,}$/.test(usernameslug)) {
            $('.userregstatus').text("Username invalid").css("color", "red");
            return;
        }

        $.ajax({
            type: "POST",
            url: "./memberlings.php", 
            xhrFields: {
                withCredentials: true
            },
            data: {
                operation: 'namecheck',
                user_name: usernameslug,
            },
            success: function(response)
            {

                if (response == 'taken')
                {
                    $('.userregstatus').text("Username is taken").css("color", "red");
                    username_ready = false;
                    check_sign_up();
        
                }
                else
                {
                    $('.userregstatus').text("Username is available").css("color", "#00ff00");
                    username_ready = true;
                    check_sign_up();
        
                }
            
            }});

    });


    $(document).on("input", ".passwordreg", function() 
    {
        var passwordslug = $(this).val();
        
        var regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;'"\\|,<.>\/?`~-])[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;'"\\|,<.>\/?`~-£]{8,}$/;
        if (regex.test(passwordslug)) 
        {
            $('.passregstatus').text("Password is valid").css("color", "#00ff00");
            password_ready = true;
            check_sign_up();
        
        } 
        else 
        {
            $('.passregstatus').text("Password not valid").css("color", "#ff0000");
            password_ready = false;
            check_sign_up();
        }
    });
        
        


    $(document).on("input", ".passwordregrepeat", function() 
    {
        var passwordslugrepeat = $(this).val();
        var passwordslug = $(".passwordreg").val();
        
        if (passwordslugrepeat == passwordslug) 
        {
            $('.passregrepeatstatus').text("Passwords match").css("color", "#00ff00");
            password_again_ready = true;
            check_sign_up();
        
        } 
        else 
        {
            $('.passregrepeatstatus').text("Passwords do not match").css("color", "#ff0000");
            password_again_ready = false;
            check_sign_up();
        
        }
    });
        
    $(document).on("input", ".emailreg", function() {
        var emailslug = $(this).val();
        
        // Regular expression for email validation
        var emailRegex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,})+$/;
    
        if (emailRegex.test(emailslug)) {
            $('.emailregstatus').text("Email address is valid").css("color", "#00ff00");
            email_ready = true;
            check_sign_up();
            

        } else {
            $('.emailregstatus').text("Email address not valid").css("color", "#ff0000");
            email_ready = false;
            check_sign_up();
        
        }
    });
    

    

    function check_sign_up()
    {
        if (username_ready && password_ready && password_again_ready && email_ready)
        {
            $(".sgnup").prop("disabled", false);
        }
        else
        {
            $(".sgnup").prop("disabled", true);
        }


    }          


        
        $(document).on("click", ".doregister", function() 
        {
            // Create a modal
            var modal = $("<div>").addClass("registermodal");
            
            // Create a cancel button
            var cancelButton = $("<button>").text("Cancel").addClass("regmodalbutton").addClass("signupcancel").on("click", function() {
                // Close the modal when the OK button is clicked
                modal.remove();
                $(".overlay").remove();
            });

            
            // Create a submit button
            var submitButton = $("<button>").text("Register").addClass("regmodalbutton").addClass("sgnup").attr("disabled","true").on("click", function() 
            {
                // Close the modal when the OK button is clicked

                // get the inputs from the modal
                var username_string = $('.usernamereg').val();
                var password_string = $('.passwordreg').val();
                var password_again_string = $('.passwordregrepeat').val();
                var email_address_string = $('.emailreg').val();


                // sign up
                $.ajax({
                    type: "POST",
                    url: "./memberlings.php", 
                    xhrFields: {
                        withCredentials: true
                    },
                    data: {
                        operation: 'createuser',
                        user_name: username_string,
                        pass_word: password_string,
                        pass_word_again: password_again_string,
                        email_address: email_address_string
                    },
                    success: function(response)
                    {
    
                        
                        if (response == 'false')
                        {

                            $('.signupstatus').text("Error: Account could not be created as username may already exist.").css("color", "#ff0000");

                        }
                        else
                        {
                            
                            $('.signupstatus').text("Account created, you may now log in.").css("color", "#00ff00");
                            $('.userregstatus').text("");
                            $('.passregstatus').text(""); 
                            $('.passregrepeatstatus').text(""); 
                            $('.emailregstatus').text("");
                            $('.usernamereg').val("");
                            $('.passwordreg').val("");
                            $('.passwordregrepeat').val("");
                            $('.emailreg').val("");
                            check_sign_up();

                        }
                    
                    }});

            });
            
            // Add things
            modal.append('<div style="text-align: center; margin: 0 auto; width: 80%;"><div style="text-align: left;"><br/>\n\
            <label style="text-align: left; margin: 0 auto; font-size: 1.3vw;">Create Account</label><br/><br/>\n\
            <label for="username_reg">Username</label><br/>\n\
            <div style="font-size: 0.9vw; line-height: 15px; padding-top: 4px;">- Minimum 6 characters.<br/>- Letters, numbers &amp; underscore only.</div>\n\
            <input id="username_reg" type="text" placeholder="Username" maxlength="255" class="registerinput usernamereg"/><br/>\n\
            <span class="status userregstatus"></span><br/>\n\
            <label for="password_reg">Password</label><br/>\n\
            <div style="font-size: 0.9vw; line-height: 15px; padding-top: 4px;">- Minimum 8 characters.<br/>- At least upper case letter.<br/>- At least 1 number.<br/>- At least 1 special character.</div>\n\
            <input id="password_reg" type="password" placeholder="Password" maxlength="255" class="registerinput passwordreg"/><br/>\n\
            <span class="status passregstatus"></span><br/>\n\
            <label for="password_reg_repeat">Repeat Password</label><br/>\n\
            <input id="password_reg_repeat" type="password" placeholder="Password" maxlength="255" class="registerinput passwordregrepeat"/><br/>\n\
            <span class="status passregrepeatstatus"></span><br/>\n\
            <label for="email_reg">Email Address</label><br/>\n\
            <input id="email_reg" type="text" placeholder="username@example.com" maxlength="255" class="registerinput emailreg"/>\n\
            <span class="status emailregstatus"></span><br/><br/><span class="status signupstatus" style="font-size: 1vw;"></span></div>');
            
            modal.append("<br/>");
            modal.append(cancelButton);
            modal.append(submitButton);
            
            // Add an overlay to the website
            var overlay = $("<div>").addClass("overlay").addClass("modaloverlay");
            
            // Add the modal and overlay to the website
            $("body").append(overlay).append(modal);
            });
          
            
        $(document).on("click", ".dologin", function() 
        {
            var specified_username = $(".usernameinput").val();
            var specified_password = $(".passwordinput").val();

            
            // try login
            $.ajax({
                type: "POST",
                url: "./memberlings.php", 
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    user_name: specified_username,
                    pass_word: specified_password,
                    operation: 'loginuser'
                },
                success: function(response) 
                {
                    if (response == 'true')
                    {
                        $("#loginstatus").text('Login successful');

                        // switch out panel
                        $("#account").empty();
                        $("#account").append('<div style="text-align: center;">Logged in as<br/>'+specified_username+'<br/><br/>\n\
                        <button id="logout_button" class="logoutbutton dologout">Log Out</button>\n\
                        </div>');

                    }      
                    else
                    {
                        $("#loginstatus").text('Invalid login');
                    }
                }
            });
        });   

        $(document).on("click", ".dologout", function() 
        {
            // try login
            $.ajax({
                type: "POST",
                url: "./memberlings.php", 
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    operation: 'logoutuser'
                },
                success: function() 
                {
                    $("#account").empty();
                    $("#account").append('<div style="font-size: 1.2vw; color: #404040; text-align: center;">Sign In<br/>Or Register<br/><br/>\n\
                    <div style="text-align: left; padding-left: 1.4vw; margin-bottom: 0.6vh;"><label for="username_input">Username</label></div>\n\
                    <input id="username_input" type="text" placeholder="Username" maxlength="255" class="signinput usernameinput"/><br/>\n\
                    <br/>\n\
                    <div style="text-align: left; padding-left: 1.4vw; margin-bottom: 0.6vh;"><label for="password_input">Password</label></div>\n\
                    <input id="password_input" type="password" placeholder="Password" maxlength="255" class="signinput passwordinput"/><br/>\n\
                        <br/>\n\
                        <button id="login_button" class="loginbutton dologin">Sign In</button>&nbsp;&nbsp;&nbsp;\n\
                        <button id="register_button" class="loginbutton doregister">Register</button>\n\
                    </div><br/>\n\
                    <span id="loginstatus"></span>');
            

                }
            });
        });



        $(document).on("click", ".deleteitem", function() 
        {
            var itemID = $(this).attr('id');
            delete_item(itemID);
        });

        function delete_item(item_id)
        {
            console.log('delete: '+item_id);

            $.ajax({
                type: "POST",
                url: "./backwash.php",
                data: {
                    post_type: '666',
                    item_id: item_id,
                },
                xhrFields: {
                    withCredentials: true
                },
                success: function(response) 
                {
                    console.log('response: '+response);

                    load_topics();

                }
            });


        }

