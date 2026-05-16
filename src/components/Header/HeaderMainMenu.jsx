//src/components/Header/HeaderMainMenu.jsx
import { NavLink } from "react-router-dom";
import { wpUrlToClientPath } from "../../helpers/wpUrlToClientPath";
import styles from "./styles/HeaderMainMenu.module.css";


export function HeaderMainMenu({ items }) {
  return (
    <nav className={styles.mainMenuContainer}>
      {items.map((item) => {
        // Convirtiendo la URL absoluta de WP a /plumbing, /drainage, etc
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
      })} 
    </nav>
  );
}
