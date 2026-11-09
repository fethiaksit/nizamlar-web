    </div><!-- /.adm-content -->
  </main>
</div><!-- /.adm-layout -->

<script>
// Mobil menü açma/kapatma
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('admMenuToggle');
  const sidebar = document.getElementById('admSidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 900 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  }
});

// Pano kopyalama yardımcısı
function copyToClipboard(text, successMsg = 'Panoya kopyalandı!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert(successMsg);
    }).catch(() => {
      prompt('Lütfen bu metni kopyalayınız:', text);
    });
  } else {
    prompt('Lütfen bu metni kopyalayınız:', text);
  }
}
</script>
</body>
</html>
