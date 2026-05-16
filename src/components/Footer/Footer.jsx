//src/components/Footer/Footer.jsx
import logo from "./../../assets/milani_logo_footer_mobil.svg";
import wsspIcon from "./../../assets/Phone.svg";
import tuerca from "./../../assets/tuerca.svg";
import bbb from "./../../assets/bbb.svg";
import hoja from "./../../assets/hoja.svg";

export function Footer({ switchFormModal, currentPhone, currentLocation }) {
  // ---------------------------------------------------------
  // 🟢 FALLBACK DEFAULT (PRIMER LOAD)
  // ---------------------------------------------------------
  const safePhone =
    currentPhone && currentPhone !== "null"
      ? currentPhone
      : localStorage.getItem("currentPhone") && localStorage.getItem("currentPhone") !== "null"
      ? localStorage.getItem("currentPhone")
      : "604-888-8888";

  const safeCity =
    currentLocation && currentLocation !== "null"
      ? currentLocation
      : localStorage.getItem("currentLocation") && localStorage.getItem("currentLocation") !== "null"
      ? localStorage.getItem("currentLocation")
      : "Vancouver";

  const phone = safePhone;
  const city = safeCity;

  return (
    <>
      <div className="headFooter">
        <div className="container-footer">
          <div className="head">
            <figure className="figureFooter">
              <img src={logo} alt="logo footer" className="imgFooter" width="180" height="48"/>
            </figure>

            <div className="buttons">
              <div className="buttons-block">
                <a
  href={`tel:+1${phone.replace(/\D/g, "")}`}
>
                  <div className="button button-book">
                  <img src={wsspIcon} alt="whatsapp" className="btn-icon" />
                  <span>{phone}</span>
                </div>
                </a>

                <div
                  className="button button-book"
                  onClick={switchFormModal}
                >
                  BOOK NOW
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container-footer">
          <div className="footer-header">
            <h4>Fast, Fair, and Reliable Service is our Promise</h4>
          </div>

          <div className="services-grid">
            <div className="service-column plumbing">
              <p className="service-column-name">Plumbing</p>
              <ul>
                <li><a href="/service/plumbing/maintenace-and-repair/">Maintenance and Repair</a></li>
                <li><a href="/service/plumbing/hot-water-heater/">Hot Water Heater</a></li>
                <li><a href="/service/plumbing/water-main-replacement/">Water Main Replacement</a></li>
                <li><a href="/service/plumbing/installations/">Installations</a></li>
                <li><a href="/service/plumbing/trenchless-pipe-repair/">Trenchless Pipe Repair</a></li>
              </ul>
            </div>

            <div className="service-column drainage">
              <p className="service-column-name">Drainage</p>
              <ul>
                <li><a href="/service/drainage/drainage-sewer-installation/">Drainage & Sewer Installation</a></li>
                <li><a href="/service/drainage/drainage-and-sewer-maintenance/">Drainage and Sewer Maintenance</a></li>
                <li><a href="/service/drainage/drainage-line-repair-service/">Drainage Line Repair & Service</a></li>
                <li><a href="/service/drainage/drain-tile-systems/">Drain Tile Systems</a></li>
                <li><a href="/service/drainage/drain-tile-sewer-inspection/">Drain Tile & Sewer Inspection</a></li>
                <li><a href="/service/drainage/pressure-jetting-cleaning/">Pressure Jetting & Cleaning</a></li>
                <li><a href="/service/drainage/vacuum-truck-service/">Vacuum Truck Service</a></li>
              </ul>
            </div>

            <div className="service-column heating">
              <p className="service-column-name">Heating</p>
              <ul>
                <li><a href="/service/heating/furnaces/">Furnaces</a></li>
                <li><a href="/service/heating/boilers/">Boilers</a></li>
                <li><a href="/service/heating/heat-pumps/">Heat Pumps</a></li>
                <li><a href="/service/heating/green-heating-solutions/">Green Heating Solutions</a></li>
                <li><a href="/service/heating/air-filters/">Air Filters</a></li>
              </ul>
            </div>

            <div className="service-column airconditioning">
              <p className="service-column-name">Air Conditioning</p>
              <ul>
                <li><a href="/service/air-conditioning/air-conditioning-units/">Air Conditioning Units</a></li>
                <li><a href="/service/air-conditioning/repair-merrit/">Repair and Replacement</a></li>
                <li><a href="/service/air-conditioning/ductless-mini-splits/">Ductless Mini Splits</a></li>
                <li><a href="/service/air-conditioning/heat-pumps/">Heat Pumps</a></li>
              </ul>
            </div>

            <div className="service-column with-border">
              <div className="little-border">
                <ul>
                  <li><a href="/offers">Promotions</a></li>
                  <li><a href="/commercial-services">Commercial Service</a></li>
                  <li><a href="/rebates-bc">Rebate Information</a></li>
                  <li><a href="/careers">Careers</a></li>
                  <li><a href="/online-payments">Payments</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="contact-section">
            <div className="contact-box1">
              <div className="contact-info">
                <p>{city} Service</p>
                <div className="phone">{phone}</div>
                <div className="email"><a href="mailto:customerservice@milani.ca">customerservice@milani.ca</a></div>
              </div>
            </div>

            <div className="badges2">
              <figure className="bbb-figure">
                <img src={bbb} alt="bbb" />
              </figure>
              <div className="tsbc-info">
                <img src={tuerca} alt="tuerca" />
                <span>TSBC Licence: LEL0209964 / LGA0001985</span>
              </div>
            </div>

            <div className="canadian-business">
              <figure>
                <img
                  src={hoja}
                  alt="hoja"
                  className="canadian-bussiness__img"
                />
              </figure>
              <span>A Family Owned Canadian Business</span>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © 2008 - 2025 Milani Plumbing, Heating & Air Conditioning. All
              rights reserved. View our <span><a href="/privacy-security-policy/">Privacy & Security Policy</a></span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
