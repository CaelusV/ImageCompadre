function setToolbar() {
    var zoomSlider = document.getElementById("zoom-slider");
    var beforeTitleInput = document.getElementById("before-title-input");
    var beforeTitle = document.getElementById("before-title");
    var afterTitleInput = document.getElementById("after-title-input");
    var afterTitle = document.getElementById("after-title");
    var descriptionInput = document.getElementById("description-input");
    var description = document.getElementById("description");

    zoomSlider.oninput = function() {
        document.documentElement.style.setProperty("--zoom-speed", this.value);
    }

    beforeTitleInput.oninput = function(e) {
        beforeTitle.innerText = e.target.value;
    }

    afterTitleInput.oninput = function(e) {
        afterTitle.innerText = e.target.value;
    }

    descriptionInput.oninput = function(e) {
        description.innerText = e.target.value;
    }
}


var has_run = false;
function run() {
    var style = getComputedStyle(document.body);
    var before_path = style.getPropertyValue('--before');
    var after_path = style.getPropertyValue('--after');

    var before = document.getElementById('before');
    before.setAttribute('src', before_path);
    var after = document.getElementById('after');
    after.setAttribute('src', after_path);

    before.onload = function() {
        updateImages();
        initComparisons();
        has_run = true;
    }

    after.onload = function() {
        updateImages();
        initComparisons();
        has_run = true;
    }

    function updateImages() {
        var scale = 1;
        var width_min_str = style.getPropertyValue('--img-width-min');
        const width_min = parseInt(width_min_str.replace("px", ""));
        var width_max_str = style.getPropertyValue('--img-width-max');
        const width_max = parseInt(width_max_str.replace("px", ""));
        var height_max_str = style.getPropertyValue('--img-height-max');
        const height_max = parseInt(height_max_str.replace("px", ""));

        const wh_max_ratio = width_max / height_max;
        const ratio1 = before.naturalWidth / before.naturalHeight;
        const ratio2 = after.naturalWidth / after.naturalHeight;
        let width1_adjusted;
        let height1_adjusted;
        let width2_adjusted;
        let height2_adjusted;
        // height needs to be adjusted based on clamped width.
        if (wh_max_ratio <= ratio1) {
            width1_adjusted = clamp(before.naturalWidth, width_min, width_max);
            height1_adjusted = width1_adjusted / ratio1;
        }
        else {
            // width needs to be adjusted based on clamped height.
            height1_adjusted = clamp(before.naturalHeight, 0, height_max);
            width1_adjusted = height1_adjusted * ratio1;
        }

        // height needs to be adjusted based on clamped width.
        if (wh_max_ratio <= ratio2) {
            width2_adjusted = clamp(after.naturalWidth, width_min, width_max);
            height2_adjusted = width2_adjusted / ratio2;
        }
        else {
            // width needs to be adjusted based on clamped height.
            height2_adjusted = clamp(after.naturalHeight, 0, height_max);
            width2_adjusted = height2_adjusted * ratio2;
        }

        // Use the width and height that is greatest after adjustment.
        let width;
        let height;
        if (width1_adjusted * height1_adjusted >= width2_adjusted * height2_adjusted) {
            width = width1_adjusted;
            height = height1_adjusted;
        }
        else {
            width = width2_adjusted;
            height = height2_adjusted;
        }

        before.setAttribute('width', width);
        before.setAttribute('height', height);
        after.setAttribute('width', width);
        after.setAttribute('height', height);

        const zoom_text = document.getElementById("zoom-level");
        const select_before = document.getElementById("select-before");
        const select_after = document.getElementById("select-after");
        const img_container = document.getElementById("comp-container");
        img_container.style.height = height + "px";
        img_container.style.width = width + "px";

        if (has_run) {
            img_container.removeEventListener("wheel", zoom);
            select_before.removeEventListener("change", changeBefore);
            select_after.removeEventListener("change", changeAfter);

            // Reset zoom on changing image.
            before.style = null;
            after.style = null;
            zoom_text.textContent = "1.00";
        }
        img_container.addEventListener("wheel", zoom);
        select_before.addEventListener("change", changeBefore);
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
            const zoom_factor = parseFloat(style.getPropertyValue("--zoom-factor"));
            const zoom_speed = parseFloat(style.getPropertyValue("--zoom-speed"));

            if (delta === 1 && scale - zoom_speed * zoom_factor - 1 <= Number.EPSILON) {
                scale = 1;
                zoom_text.textContent = "1.00";
                before.style = null;
                after.style = null;
                return false;
            }

            const decimalX = e.offsetX / width * 100;
            const decimalY = e.offsetY / height * 100;

            // delta of 1 means we're zooming out.
            if (delta === 1) {
                // NOTE: image-rendering and max-width should already be set if we're decreasing scale towards 1.
                scale = clamp(scale - zoom_speed * zoom_factor, 1, 10);

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

                scale = clamp(scale + zoom_speed * zoom_factor, 1, 10);
                before.style.transform = "scale(" + scale + ")";
                after.style.transform = "scale(" + scale + ")";

                before.style.transformOrigin = decimalX + "% " + decimalY + "% 0px";
                after.style.transformOrigin = decimalX + "% " + decimalY + "% 0px";
            }
            zoom_text.textContent = scale.toFixed(2);
        }
    }
}


// Disgusting that JS doesn't have a clamp function. Then again, fuck readability, right?
function clamp(num, min, max) {
    return Math.max(min, Math.min(num, max));
}


function initComparisons() {
    const overlay = document.getElementById("img-overlay");
    var clicked = 0;
    // Use one of the images to get width instead of overlay.
    // Changing image would otherwise miscalculate w.
    const before_image = document.getElementById("before");
    const w = before_image.offsetWidth;
    const h = overlay.offsetHeight;
    overlay.style.width = (w / 2) + "px";

    const slider = document.getElementById("img-slider");
    slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
    slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";

    var img_container = document.getElementById("comp-container");
    if (has_run) {
        img_container.removeEventListener("mousedown", slideReady);
        img_container.removeEventListener("touchstart", slideReady);
        window.removeEventListener("mouseup", slideFinish);
        window.removeEventListener("touchend", slideFinish);
    }
    img_container.addEventListener("mousedown", slideReady);
    img_container.addEventListener("touchstart", slideReady);
    window.addEventListener("mouseup", slideFinish);
    window.addEventListener("touchend", slideFinish);

    function slideReady(e) {
        // Prevent any other actions that may occur when moving over the image.
        e.preventDefault();
        // Make the slider jump to where we click before we move the mouse.
        var pos = clamp(getCursorPosX(e), 0, w);
        slide(pos);

        var description = document.getElementById("description");
        description.style.opacity = 0.4;

        clicked = 1;
        window.addEventListener("mousemove", slideMove);
        window.addEventListener("touchmove", slideMove);
    }

    function slideFinish() {
        var description = document.getElementById("description");
        description.style.opacity = 1;
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