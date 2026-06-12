// src/app/privacy-policy/page.tsx
import Card from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      <Card>
        <h1 className="home-title">Политика конфиденциальности</h1>
        <p className="text-gray" style={{ marginBottom: "24px" }}>
          Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h3 className="section-title">1. Общие положения</h3>
          <p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта Football Hub (далее — Сайт). Используя Сайт, вы соглашаетесь с условиями настоящей Политики.</p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 className="section-title">2. Какие данные мы собираем</h3>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li><strong>При регистрации:</strong> имя пользователя, полное имя, адрес электронной почты, пароль (в хэшированном виде).</li>
            <li><strong>При редактировании профиля:</strong> город, позиция, контакты, дата рождения, статистика, фотография профиля.</li>
            <li><strong>Автоматически:</strong> IP-адрес, тип браузера, cookies, данные о действиях на Сайте.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 className="section-title">3. Цели обработки данных</h3>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>Идентификация пользователя и предоставление доступа к функционалу Сайта.</li>
            <li>Отображение новостей, матчей, календаря событий.</li>
            <li>Обеспечение работы чата и текстовых трансляций.</li>
            <li>Улучшение качества сервиса и устранение технических проблем.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 className="section-title">4. Хранение и защита данных</h3>
          <p>Персональные данные хранятся на серверах, расположенных на территории Российской Федерации. Пароли хранятся в хэшированном виде (bcrypt) и не могут быть восстановлены в исходном виде. Доступ к данным имеют только администраторы Сайта в объеме, необходимом для выполнения их функций.</p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 className="section-title">5. Права пользователя</h3>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>Получить информацию о своих персональных данных.</li>
            <li>Требовать уточнения, блокирования или уничтожения своих данных.</li>
            <li>Отозвать согласие на обработку персональных данных.</li>
            <li>Удалить свой аккаунт и все связанные данные.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 className="section-title">6. Cookies</h3>
          <p>Сайт использует cookies для обеспечения работы системы аутентификации (NextAuth), сохранения предпочтений пользователя и анализа посещаемости. Вы можете отключить cookies в настройках браузера, но это может ограничить функциональность Сайта.</p>
        </section>

        <section>
          <h3 className="section-title">7. Контакты</h3>
          <p>По вопросам, связанным с обработкой персональных данных, обращайтесь: <strong>[vbikov.td@gmail.com]</strong></p>
        </section>
      </Card>
    </div>
  );
}