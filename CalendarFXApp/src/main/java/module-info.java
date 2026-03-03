//This code just ensures you have the packages you need to design the frontend

module com.calendarfx.app {
    requires transitive javafx.graphics;
    requires fr.brouillard.oss.cssfx;
    requires javafx.controls;
    requires com.calendarfx.view;
    requires atlantafx.base;
    requires org.scenicview.scenicview;

    exports com.calendarfx.app;
}