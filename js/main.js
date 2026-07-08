document.addEventListener('DOMContentLoaded', function() {

    // Accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(function(header) {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            const isActive = item.classList.contains('active');
            
            // Chiudi tutti
            document.querySelectorAll('.accordion-item').forEach(function(i) {
                i.classList.remove('active');
            });
            
            // Apri quello cliccato
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

});
