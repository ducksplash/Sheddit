        var title_maxchars = 100;
        var body_maxchars = 1000;
        var link_maxchars = 200;
        var file_maxbytes = 200000;
        var file_b64_body = '';
        var title_ready = false;
        var post_ready = false;
        
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
