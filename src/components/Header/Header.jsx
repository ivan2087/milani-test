//src/components/Header/Header.jsx
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderMenus } from "./HeaderMenus";
import styles from "./styles/Header.module.css";
import { useIPLocation } from "../../hooks/useIPLocation";


const GET_HEADER = gql`
  query {
    salientLogo
    topMenu { label url target kind objectType objectId } 
    menuKelowa { label url target kind objectType objectId }
    menuVancouver { label url target kind objectType objectId }
  }
`;

export function Header() {
  const { location } = useIPLocation();
  const { data, loading } = useQuery(GET_HEADER);

  if (loading || !data) return null;
// United States
  const mainItems =
    location?.pais === "United States" ? data.menuVancouver : data.menuKelowa; // cambio automático
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <HeaderLogo logo={data.salientLogo} />
        <HeaderMenus topMenu={data.topMenu} mainMenu={mainItems} />
      </div>
    </header>)
}



