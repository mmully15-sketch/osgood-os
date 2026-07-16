export default function VenueReferencePage(){
  return <>
    <section className="hero">
      <h1>Venue Reference</h1>
      <p>Current internal reference for room capacities, package inclusions, pricing, amenities, parking, and common sales questions.</p>
    </section>

    <div className="reference-grid">
      <section className="reference-card">
        <div className="reference-label">Reception Space</div>
        <h2>The Ballroom</h2>
        <div className="capacity">Up to 350 guests</div>
        <p>Approximately 6,000 square feet with a mezzanine level overlooking the event space.</p>
        <ul>
          <li>Wedding receptions, galas, banquets, proms, and corporate events</li>
          <li>Two-tier reception area</li>
          <li>Bar with six keg taps</li>
          <li>Caterer staging areas</li>
          <li>Flexible floor plans</li>
        </ul>
      </section>

      <section className="reference-card">
        <div className="reference-label">Ceremonies & Performances</div>
        <h2>Grand Auditorium</h2>
        <div className="capacity">Up to 500 seats</div>
        <p>Historic auditorium with soaring ceilings, ornate woodwork, theatre seating, stage, and a four-register pipe organ.</p>
        <ul>
          <li>Wedding ceremonies</li>
          <li>Concerts and theatrical performances</li>
          <li>Award ceremonies and presentations</li>
          <li>Excellent acoustics</li>
          <li>Ground-level ceremony seating available</li>
        </ul>
      </section>

      <section className="reference-card">
        <div className="reference-label">Intimate Events</div>
        <h2>Conference Room</h2>
        <div className="capacity">Up to 90 guests</div>
        <p>Approximately 1,400 square feet with original wainscoting and coffered ceiling details.</p>
        <ul>
          <li>Board meetings and executive retreats</li>
          <li>Bridal and baby showers</li>
          <li>Rehearsal dinners and brunches</li>
          <li>VIP receptions and private dinners</li>
          <li>Workshops and seminars</li>
        </ul>
      </section>

      <section className="reference-card wide">
        <div className="reference-label">Wedding Package</div>
        <h2>Signature Celebration</h2>
        <ul>
          <li>Single-day building access from 7:00 AM to 11:00 PM</li>
          <li>Tables and chairs for up to 350 guests</li>
          <li>Two-tier reception area with open mezzanine level</li>
          <li>Private parking lot</li>
          <li>Elevator access from street level</li>
          <li>Lobby and welcome area with piano</li>
          <li>Coat room, restrooms, caterer staging, and six-tap bar</li>
          <li>Exterior grounds for photography</li>
        </ul>
        <div className="sales-tip"><b>Optional:</b> Add Salon and Library Suite for $500.</div>
      </section>

      <section className="reference-card wide">
        <div className="reference-label">Wedding Package</div>
        <h2>Heritage Experience</h2>
        <ul>
          <li>All Signature Celebration amenities</li>
          <li>Early access to Bridal Suite and Groom’s Suite</li>
          <li>Ground-level auditorium seating for 100 guests with white-covered chairs</li>
          <li>Theatre seating for up to an additional 250 guests</li>
          <li>Historic four-register pipe organ, subject to organist availability</li>
          <li>Bridal Suite with vintage chairs, private bathroom, and lounge</li>
          <li>Groom’s Suite with private bar, pool table, ping-pong, lounge, and suit storage</li>
        </ul>
      </section>

      <section className="reference-card wide">
        <div className="reference-label">Wedding Package</div>
        <h2>Legacy Weekend</h2>
        <ul>
          <li>All Signature and Heritage amenities</li>
          <li>Full-facility access from Friday at 10:00 AM through Sunday at 10:00 AM</li>
          <li>Conference Room seating for up to 90 guests</li>
          <li>Suitable for rehearsal dinner, welcome reception, happy hour, brunch, or lunch</li>
        </ul>
        <div className="sales-tip"><b>Flat rate:</b> $12,000.</div>
      </section>

      <section className="reference-card wide">
        <div className="reference-label">Wedding Pricing</div>
        <h2>Signature Celebration</h2>
        <div className="rate-table">
          <div>Monday–Wednesday</div><div><b>$2,500</b></div>
          <div>Thursday</div><div><b>$3,000</b></div>
          <div>Friday</div><div><b>$4,500</b></div>
          <div>Saturday</div><div><b>$6,000</b></div>
          <div>Sunday</div><div><b>$4,000</b></div>
        </div>
      </section>

      <section className="reference-card wide">
        <div className="reference-label">Wedding Pricing</div>
        <h2>Heritage Experience</h2>
        <div className="rate-table">
          <div>Monday–Wednesday</div><div><b>$3,500</b></div>
          <div>Thursday</div><div><b>$4,000</b></div>
          <div>Friday</div><div><b>$5,500</b></div>
          <div>Saturday</div><div><b>$7,000</b></div>
          <div>Sunday</div><div><b>$4,000</b></div>
        </div>
      </section>

      <section className="reference-card full">
        <div className="reference-label">Internal Sales Answers</div>
        <h2>Common Questions</h2>

        <div className="answer">
          <b>Can the ceremony and reception both be held at The Osgood?</b>
          <p>Yes. Couples commonly hold the ceremony in the Grand Auditorium and move to the Ballroom for cocktail hour, dinner, and dancing.</p>
        </div>

        <div className="answer">
          <b>What is the practical wedding capacity?</b>
          <p>The website markets approximately 350 guests for wedding ceremonies and receptions. The auditorium itself has more fixed seating, but the wedding experience is planned around the Ballroom’s reception capacity.</p>
        </div>

        <div className="answer">
          <b>How far in advance should couples book?</b>
          <p>Saturday and peak-season weddings are generally best booked 12 to 18 months in advance.</p>
        </div>

        <div className="answer">
          <b>Can different spaces be used throughout the event?</b>
          <p>Yes. The Auditorium, lobby or intermediate spaces, Ballroom, Conference Room, Bridal Suite, and Groom’s Suite can support a multi-space experience depending on the package and contract.</p>
        </div>

        <div className="answer">
          <b>Does the venue have elevator access?</b>
          <p>Yes. Elevator access is available from street level.</p>
        </div>

        <div className="answer">
          <b>Are hotels nearby?</b>
          <p>The venue is close to downtown Bay City lodging, including the DoubleTree riverfront area, Courtyard by Marriott, historic bed-and-breakfast options, and short-term rentals.</p>
        </div>
      </section>

      <section className="reference-card wide">
        <div className="reference-label">Parking & Access</div>
        <h2>Operational Notes</h2>
        <ul>
          <li>Private parking lot is approximately 100 feet by 200 feet.</li>
          <li>Planning estimate is roughly 55 to 60 vehicles with standard circulation.</li>
          <li>ADA spaces, loading, traffic flow, and event-specific access must be preserved.</li>
          <li>Overflow parking or parking attendants may be needed for larger events.</li>
          <li>Do not promise a specific parking count without confirming the final striping and event layout.</li>
        </ul>
      </section>

      <section className="reference-card wide contact-block">
        <div className="reference-label">Contact</div>
        <h2>The Osgood Wedding and Events Venue</h2>
        <p>
          614 Center Avenue<br/>
          Bay City, Michigan 48708
        </p>
        <p>
          <b>Phone:</b> 989-214-3733<br/>
          <b>Email:</b> info@theosgood.com<br/>
          <b>Website:</b> theosgood.com
        </p>
        <p>Located in Bay City’s historic Center Avenue district.</p>
      </section>
    </div>
  </>;
}
