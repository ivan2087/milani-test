//src/components/Header/HeaderTopMenu.jsx
import styles from "./styles/HeaderTopMenu.module.css";
import { wpUrlToClientPath } from "../../helpers/wpUrlToClientPath";
import { NavLink } from "react-router-dom";

// Menu superior (TopMenu)
export function HeaderTopMenu({ items }) {
  return (
    <div className={styles.topMenuContainer}>
      {
        items.map((item) => {
          // Convirtiendo la URL absoluta de WP a /offers, /heating, etc
          const to = wpUrlToClientPath(item.url);
          return (
            <NavLink
              key={item.label}
              to={to}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            >
              { item.label }
            </NavLink>
          )
        })
      }
      <img src={""} alt="lupa" className={styles.lupa} />
    </div>
  );
}
