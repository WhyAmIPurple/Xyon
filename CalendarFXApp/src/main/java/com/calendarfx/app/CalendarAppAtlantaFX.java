package com.calendarfx.app;
//Remember to look at the themes you want and import them
import atlantafx.base.theme.NordDark;
import atlantafx.base.theme.NordLight;

public class CalendarAppAtlantaFX extends CalendarApp {

    public static void main(String[] args) {
        //This part of the code sets theme of the calendar
        System.setProperty("atlantafx", "true");
        setUserAgentStylesheet(new NordDark().getUserAgentStylesheet());
        launch(args);
    }
}
