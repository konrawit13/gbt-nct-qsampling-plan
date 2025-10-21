$(document).ready(function() {
    $('#ingTable').DataTable({
        "ajax": {
            "url": "js/sampling_plan2025.json",
            "dataSrc": "root"
        },

        "columns": [

            { "data": "sample_sending_id" ,"title":"sample_sending_id"},
            {
                "data": "sample_sending_date", 
                "title":"sample_sending_date",
                "render": function(data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        const date = new Date(data);
                        return date.toLocaleString('en-US', {
                            year:"numeric",
                            month: "short",
                            day: "numeric"
                        });
                    }
                    return data;
                }
            },
            { "data": "sample_lotnum" , "title": "sample_lotnum"},
            { "data": "sampling_purpose", "title": "sampling_purpose"}
        ],

        "dom": 'Bfrtip',
        "buttons": [
            {
                extend: 'colvis',
                text: 'Show/Hide Columns'
            }
        ],

        "responsive": true, // Makes the table responsive
        // "language": {
        //     "search": "Search:" // Customizing the search input label
        // }
    });
});

// async function loadJson() {
//     const response = fetch('')
// }

// document.addEventListener("DOMContentLoaded", () => {

// });