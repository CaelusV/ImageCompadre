var has_run = false;
function run() {
    var style = getComputedStyle(document.body);
    var before_path = style.getPropertyValue('--before');
    var after_path = style.getPropertyValue('--after');

    var before = document.getElementById('before');
    before.setAttribute('src', before_path);
    var after = document.getElementById('after');
    after.setAttribute('src', after_path)

    before.onload = function() {
        updateImages();
        initComparisons();
        has_run = true;
    }

    function updateImages() {
        var scale = 1;
        var width_min_str = style.getPropertyValue('--img-width-min');
        var width_min = parseInt(width_min_str.replace("px", ""));
        var width_max_str = style.getPropertyValue('--img-width-max');
        var width_max = parseInt(width_max_str.replace("px", ""));

        // Use the greatest width of the two images, and the height of that image.
        var width = clamp(
            Math.max(before.naturalWidth, after.naturalWidth),
            width_min,
            width_max
        );
        var ratio = width / Math.max(before.naturalWidth, after.naturalWidth);
        var height = Math.round(
            (before.naturalWidth > after.naturalWidth ? before.naturalHeight : after.naturalHeight) * ratio
        );

        before.setAttribute('width', width);
        before.setAttribute('height', height);
        after.setAttribute('width', width);
        after.setAttribute('height', height);

        var img_container = document.getElementById("comp-container");
        img_container.style.height = height + "px";
        img_container.style.width = width + "px";

        img_container.addEventListener("wheel", zoom);
        var select_before = document.getElementById("select-before");
        select_before.addEventListener("change", changeBefore);
        var select_after = document.getElementById("select-after");
        select_after.addEventListener("change", changeAfter);

        function changeBefore(e) { changePicture(e, true); }
        function changeAfter(e) { changePicture(e, false); }

        function changePicture(e, is_before) {
            var file_input = document.getElementById(is_before ? "select-before" : "select-after");
            if (!e.target.files || !e.target.files[0]) {
                file_input.style.color = "red";
                return;
            }
            file_input.style.color = "green";

            var before = document.getElementById('before');
            var reader = new FileReader();
            reader.onload = function (f) {
                if (is_before) {
                    before.setAttribute("src", f.target.result);
                }
                else {
                    after.setAttribute("src", f.target.result);
                }
            }
            reader.readAsDataURL(e.target.files[0]);
        }

        function zoom(e) {
            e.preventDefault();

            const delta = Math.sign(e.deltaY);
            const scale_add = parseFloat(style.getPropertyValue("--scale-add"));

            if (delta === 1 && scale - scale_add - 1 <= Number.EPSILON) {
                scale = 1;
                before.style = null;
                after.style = null;
                return false;
            }

            const decimalX = e.offsetX / width * 100;
            const decimalY = e.offsetY / height * 100;

            // delta of 1 means we're zooming out.
            if (delta === 1) {
                // NOTE: image-rendering and max-width should already be set if we're decreasing scale towards 1.
                scale = clamp(scale - scale_add, 1, 10);

                before.style.transform = "scale(" + scale + ")";
                after.style.transform = "scale(" + scale + ")";

                before.style.transformOrigin = decimalX + "% " + decimalY + "% 0px";
                after.style.transformOrigin = decimalX + "% " + decimalY + "% 0px";
            }
            else {
                before.style.imageRendering = "pixelated";
                after.style.imageRendering = "pixelated";

                before.style.maxWidth = "unset";
                after.style.maxWidth = "unset";

                scale = clamp(scale + scale_add, 1, 10);
                before.style.transform = "scale(" + scale + ")";
                after.style.transform = "scale(" + scale + ")";

                before.style.transformOrigin = decimalX + "% " + decimalY + "% 0px";
                after.style.transformOrigin = decimalX + "% " + decimalY + "% 0px";
            }
        }
    }
}


// Disgusting that JS doesn't have a clamp function. Then again, fuck readability, right?
function clamp(num, min, max) {
    return Math.max(min, Math.min(num, max));
}

var slider;
function initComparisons() {
    const overlay = document.getElementById("img-overlay");
    var clicked = 0;
    // Use one of the images to get width instead of overlay.
    // Changing image would otherwise miscalculate w.
    const before_image = document.getElementById("before");
    const w = before_image.offsetWidth;
    const h = overlay.offsetHeight;
    overlay.style.width = (w / 2) + "px";

    if (!has_run) {
        slider = document.createElement("div");
        slider.setAttribute("class", "img-slider");
        slider.setAttribute("id", "img-slider");
        overlay.parentElement.insertBefore(slider, overlay);
    }

    slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
    slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";

    slider.addEventListener("mousedown", slideReady);
    window.addEventListener("mouseup", slideFinish);
    slider.addEventListener("touchstart", slideReady);
    window.addEventListener("touchend", slideFinish);

    function slideReady(e) {
        // Prevent any other actions that may occur when moving over the image.
        e.preventDefault();

        clicked = 1;
        window.addEventListener("mousemove", slideMove);
        window.addEventListener("touchmove", slideMove);
    }

    function slideFinish() {
        clicked = 0;
    }

    function slideMove(e) {
        if (clicked == 0) return false;

        var pos = clamp(getCursorPosX(e), 0, w);
        slide(pos);
    }

    function getCursorPosX(e) {
        e = (e.changedTouches) ? e.changedTouches[0] : e;

        var positions = overlay.getBoundingClientRect();
        var x = e.pageX - positions.left;
        // Consider any page scrolling.
        x = x - window.pageXOffset;
        return x;
    }

    function slide(x) {
        overlay.style.width = x + "px";
        slider.style.left = overlay.offsetWidth - (slider.offsetWidth / 2) + "px";
    }
}