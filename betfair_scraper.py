from scrapers.betfair.cli import main

module_name = globals().get("_" * 2 + "name" + "_" * 2)
main_module_name = "_" * 2 + "main" + "_" * 2

if module_name == main_module_name:
    main()
