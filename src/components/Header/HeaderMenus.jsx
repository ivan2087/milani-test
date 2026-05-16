//src/components/Header/HeaderMenus.jsx
import { HeaderMainMenu } from "./HeaderMainMenu";
import { HeaderTopMenu } from "./HeaderTopMenu";
import styles from "./styles/HeaderMenus.module.css";

export function HeaderMenus ({ topMenu, mainMenu }) {
   return (
      <div className={styles.content}>
         <HeaderTopMenu items={topMenu} />
         <HeaderMainMenu items={mainMenu}/>
      </div>
   )
}