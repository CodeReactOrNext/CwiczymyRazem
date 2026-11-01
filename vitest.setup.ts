// Komponenty w testach renderują się poza AppLayout, więc pełny angielski katalog
// (lib/i18n/fullCatalog) nie jest dla nich importowany przez stronę. Rejestrujemy
// go tu raz, żeby asercje na angielskim tekście działały jak w aplikacji.
import "lib/i18n/fullCatalog";
