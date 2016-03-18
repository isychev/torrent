$(function () {
    var $table = $('.table');
    var templateRow = "<tr data-src='{id}'>\n\
                        <td>{category}</td>\n\
                        <td>{title}</td>\n\
                        <td>{size}</td>\n\
                        <td >{seeds}</td>\n\
                        </tr>";
    $('.btn-search').click(function () {
        var url = "/search/" + $(".b-search-input").val();
        $.ajax({
            url: url,
            success: function (response) {
                buidTable(response);
            }
        });
    });
    $table.on('click', 'tr', function () {
        var src = $(this).data('src');
        $.ajax({
            url: '/download/'+src,
            type: "GET",
            success: function () {
                $.ajax({
                    url: '/start/'+src
                });
                $('.progress').removeClass('hidden');
                $('.progress-bar').css('width', '0%');
                startLoading();
            }
        });
    });
    function startLoading() {
        $.ajax({
            url: '/get-process/',
            success: function (data, textStatus, jqXHR) {
                $('.progress-bar').css('width', data + '%');
                if (data < 99) {
                    setTimeout(startLoading, 3000);
                } else {
                    $('.progress-bar').css('width', '100%');
                }

            }
        });
    }
    function buidTable(data) {
        data.forEach(function (item, i) {
            var strTmpl = createTmpl(templateRow, item);
            $table.append($(strTmpl));
        });
    }
    function createTmpl(str, data) {
        if (!(str && data))
            return "";
        for (var item in data) {
            str = str.split("{" + item + "}").join(data[item]);
        }
        return str;
    }
    $('.clear-all').click(function () {
        $.ajax({
            url: '/clear-all/',
            success: function (data, textStatus, jqXHR) {
                $('.progress-bar').css('width', data + '%');
                setTimeout(startLoading, 10000);
            }
        });
    });
});