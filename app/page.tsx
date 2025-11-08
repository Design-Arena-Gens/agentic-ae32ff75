import CallAgent from "../components/CallAgent";

export default function Page() {
  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.25 6.75C2.25 5.09315 3.59315 3.75 5.25 3.75H6.14359C6.91845 3.75 7.61704 4.22606 7.8936 4.95106L9.3664 8.86644C9.63863 9.58092 9.4079 10.3926 8.80148 10.8575L7.99393 11.4755C7.90403 11.543 7.87589 11.6656 7.9254 11.7689C9.13402 14.2854 11.2146 16.366 13.7311 17.5746C13.8344 17.6241 13.957 17.596 14.0245 17.5061L14.6425 16.6985C15.1074 16.0921 15.9191 15.8614 16.6336 16.1336L20.5489 17.6064C21.2739 17.883 21.75 18.5816 21.75 19.3564V20.25C21.75 21.9069 20.4069 23.25 18.75 23.25H17.25C9.5168 23.25 3.25 16.9832 3.25 9.25V7.75C3.25 6.09315 4.59315 4.75 6.25 4.75H6.25H5.25C3.59315 4.75 2.25 6.09315 2.25 7.75V6.75Z" stroke="#0ea5e9" strokeWidth="1.5"/></svg>
          <div>
            <div className="title">Calling AI Agent</div>
            <div className="subtitle">On-device voice assistant that feels like a call</div>
          </div>
        </div>
        <CallAgent />
      </div>
    </div>
  );
}
